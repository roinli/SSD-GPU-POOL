<!--  Copyright 2020 Tianshu AI Platform and Zhejiang University. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* =============================================================
-->

<template>
  <div id="vis-graph-container">
    <div id="graph-div" class="graph-div">
      <div class="chartTooltip">
        <strong class="name"></strong>
      </div>
    </div>
    <el-select id="measure-selector" v-model="selectedMeasure" filterable @change="onMeasureChange">
      <el-option v-for="item in measureNames" :key="item" :value="item" :label="item">{{
        item
      }}</el-option>
    </el-select>
  </div>
</template>

<script>
import * as d3 from 'd3';

import { list as getMeasureNames, getGraphs } from '@/api/atlas';

import { ERROR_MSG, MEASURE_STATUS_ENUM } from './utils';

export default {
  name: 'GraphVisual',
  data() {
    return {
      measureNames: [],
      selectedMeasure: undefined,
      graphs: [],

      // 图变量保存
      forceSimulation: undefined,
      links: undefined,
      nodeGs: undefined,
      nodes: undefined,
    };
  },
  watch: {
    graphs(newVal) {
      this.updateSVG(newVal);
    },
  },
  created() {
    this.getMeasureNames(this.$route.params.measureName);
  },
  methods: {
    async getMeasureNames(defaultMeasureName) {
      const params = {
        measureStatus: MEASURE_STATUS_ENUM.SUCCESS,
        current: 1,
        size: 1000,
      };
      this.measureNames = (await getMeasureNames(params)).result.map((measure) => measure.name);
      if (defaultMeasureName && this.measureNames.includes(defaultMeasureName)) {
        this.selectedMeasure = defaultMeasureName;
      } else {
        [this.selectedMeasure] = this.measureNames;
      }
      if (this.selectedMeasure) {
        this.getGraphs(this.selectedMeasure);
      } else {
        this.graphs = {};
      }
    },
    async getGraphs(measureName) {
      this.graphs = JSON.parse(await getGraphs(measureName));
    },
    onMeasureChange(measure) {
      d3.select('#graphSvg').remove();
      this.getGraphs(measure);
    },

    // 定义一个边排序的函数 输入一个边信息对象的集合，输出经过topk排序之后的边信息对象集合。
    parseGraph(graph) {
      // 图结构检测
      if (!this.validGraph(graph)) {
        return undefined;
      }
      // 整理边信息，根据 d3 弹簧力的要求整理为带有 source 和 target 属性的对象；distance 用于表示距离
      graph.edges = graph.edges.map((e) => {
        return {
          source: graph.nodes[e[0]],
          target: graph.nodes[e[1]],
          distance: e[2],
        };
      });
      return graph;
    },
    validGraph(graph) {
      // 如果没有选中的度量图，则不报错直接返回
      if (!this.selectedMeasure) return false;

      const error = (msg) => {
        this.$message.error(msg);
        return false;
      };
      if (!graph.nodes) {
        return error(ERROR_MSG.NO_NODES);
      }
      if (!graph.edges) {
        return error(ERROR_MSG.NO_EDGES);
      }
      if (!Array.isArray(graph.nodes)) {
        return error(ERROR_MSG.NODES_NOT_ARRAY);
      }
      if (!Array.isArray(graph.edges)) {
        return error(ERROR_MSG.EDGES_NOT_ARRAY);
      }
      return true;
    },
    updateSVG(graph) {
      const graph_data = this.parseGraph(graph);
      if (!graph_data) {
        return;
      }

      // 清空重构 svg
      const graphDiv = document.getElementById('graph-div');
      const svg = d3
        .select(graphDiv)
        .append('svg')
        .attr('id', 'graphSvg');

      let width;
      let height;
      // 根据 div 框大小设置 svg 尺寸
      function updateSvgSize() {
        width = graphDiv.clientWidth;
        height = graphDiv.clientHeight;
        svg.attr('width', width).attr('height', height);
      }
      updateSvgSize();

      d3.select(window).on('resize.updatesvg', updateSvgSize);

      // 最外层增加缩放
      const g = svg.append('g');
      svg.call(
        d3
          .zoom()
          .scaleExtent([0.1, 4])
          .on('zoom', () => {
            g.attr('transform', d3.event.transform);
          })
      );

      // 创建空力导向图
      this.forceSimulation = d3
        .forceSimulation()
        // 创建空的链接力
        .force('link', d3.forceLink())
        // 使用默认设置创建多体力，将强度设为 -200，负值使节点相互排斥
        .force('charge', d3.forceManyBody().strength(-200))
        // 在图的中点偏上 50 的位置设置一个中心力
        .force('center', d3.forceCenter(width / 2, height / 2 - 50));

      // 将图的节点添加到力导向图中，同时监听 tick 事件
      this.forceSimulation.nodes(graph_data.nodes).on('tick', this.onTick);

      this.forceSimulation
        // 获取链接力
        .force('link')
        // 增加边
        .links(graph_data.edges)
        // 每一边的长度，边的长度与距离相关
        .distance((d) => (height / 4) * d.distance + 20);

      // 绘制边，给边赋值
      this.links = g
        .append('g')
        .selectAll('line')
        .data(graph_data.edges)
        .enter()
        .append('line')
        .attr('stroke', () => '#12558444')
        .attr('stroke-width', 2)
        .on('mouseover', (d) => this.onMouseOver(d, 'link'))
        .on('mouseout', this.onMouseOut);

      // 创建节点容器
      this.nodeGs = g
        .selectAll('.circleText')
        .data(graph_data.nodes)
        .enter()
        .append('g')
        .attr('transform', (d) => `translate(${d.x},${d.y})`)
        .call(
          d3
            .drag()
            .on('start', this.onDragStart)
            .on('drag', this.onDrag)
            .on('end', this.onDragEnd)
        );

      // 为节点画圆
      this.nodes = this.nodeGs
        .append('circle')
        .attr('r', (d) => d.tags.num_params / 10000000 + 10)
        .attr('fill', () => '#4188B3cc')
        .on('mouseover', (d) => this.onMouseOver(d, 'node'))
        .on('mouseout', this.onMouseOut)
        .on('click', this.onNodeClick);

      // 为节点增加文本
      this.nodeGs
        .append('text')
        .attr('x', 0)
        .attr('y', -10)
        .attr('dy', 0)
        .text((d) => d.tags.name)
        .attr('font-size', (d) => d.tags.num_params / 10000000 + 10)
        .style('font-family', 'Arial')
        .style('pointer-events', 'none') // to prevent mouseover/drag capture
        .style('opacity', '60%');

      // 禁用双击放大
      d3.select('#graphSvg').on('dblclick.zoom', null);

      // 禁用右键上下文菜单，同时恢复所有节点状态
      svg.on('contextmenu', this.onContextMenu);
    },
    onTick() {
      this.links
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);
      this.nodeGs.attr('transform', (d) => `translate(${d.x},${d.y})`);
    },
    // 处理点击节点事件
    onNodeClick(snode, index, list) {
      d3.select(list[index])
        .transition()
        .duration(750)
        .style('fill', () => {
          // 默认值为 false
          if (snode.highlighted === undefined) {
            snode.highlighted = false;
          }
          // 遍历边列表，处理与节点链接的边
          this.links.style('stroke', (l) => {
            if (l.highlighted === undefined) {
              l.highlighted = 0;
            }
            if (l.source.index === snode.index || l.target.index === snode.index) {
              // 当与连接点连接时变粗
              // 通过对链接计数来判断是否与被点击节点连接
              l.highlighted += snode.highlighted === false ? 1 : -1;
            }
            return l.highlighted > 0 ? '#125584ff' : '#12558444';
          });
          snode.highlighted = !snode.highlighted;
          return snode.highlighted ? '#225588' : '#4188B3cc';
        });
    },
    onDragStart(d) {
      if (!d3.event.active) {
        // 设置衰减系数，对节点位置移动过程的模拟，数值越高移动越快，数值范围[0，1]
        this.forceSimulation.alphaTarget(0.3).restart();
      }
      d.fx = d.x;
      d.fy = d.y;
    },
    onDrag(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    },
    onDragEnd(d) {
      if (!d3.event.active) {
        this.forceSimulation.alphaTarget(0);
      }
      d.fx = null;
      d.fy = null;
    },
    onMouseOver(d, type) {
      // 从d3.event获取鼠标的位置
      const { offsetY, offsetX } = d3.event;
      const yPosition = offsetY + 20;
      const xPosition = offsetX + 20;
      // 将浮层位置设置为鼠标位置
      const chartTooltip = d3
        .select('.chartTooltip')
        .style('left', `${xPosition}px`)
        .style('top', `${yPosition}px`);
      // 更新浮层内容
      let content;
      switch (type) {
        case 'node':
          content = this.getNodeContent(d);
          break;
        case 'link':
          content = this.getLinkContent(d);
          break;
        // no default
      }
      chartTooltip.select('.name').html(content);
      // 移除浮层hidden样式，展示浮层
      chartTooltip.classed('hidden', false);
    },
    onMouseOut() {
      // 添加浮层hidden样式，隐藏浮层
      d3.select('.chartTooltip').classed('hidden', true);
    },
    onContextMenu() {
      d3.event.preventDefault();
      this.nodes
        .transition()
        .duration(750)
        .style('fill', (node) => {
          node.highlighted = false;
          return '#4188B3cc';
        });
      this.links.style('stroke', (link) => {
        link.highlighted = 0;
        return '#12558444';
      });
    },

    getNodeContent(d) {
      let content = `<span style='color: #4466aa'>id: ${d.tags.id}</span><br>`;
      content += `<span style='color: #4466aa'>name: ${d.tags.name}</span><br>`;
      for (const prop in d.tags) {
        if (prop !== 'id' && prop !== 'name' && prop !== 'readme') {
          content += `<span style='color: #44aabb'>${prop}: ${d.tags[prop]}</span><br>`;
        }
      }
      return content;
    },
    getLinkContent(d) {
      return `<span style='color: firebrick'>source: ${d.source.tags.name}</span><br>
      <span style='color: forestgreen'>target: ${d.target.tags.name}</span><br>
      <span style='color: deepskyblue'>distance: ${d.distance}</span>`;
    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep #measure-selector {
  margin: 10px;
}

svg {
  padding: 0;
  margin: 0;
}

.chartTooltip {
  position: absolute;
  box-sizing: border-box;
  width: 400px;
  height: auto;
  padding-top: -10px;
  padding-bottom: -10px;
  padding-left: 10px;
  pointer-events: none;
  background-color: white;
  border-radius: 5px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.4);

  &.hidden {
    display: none;
  }

  p {
    margin: 0;
    font-size: 14px;
    text-align: left;
  }
}

.links line {
  stroke: #999;
  stroke-opacity: 0.6;
}

.nodes circle {
  stroke: #fff;
  stroke-width: 1.5px;
}

.graph-div {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
