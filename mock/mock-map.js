// 定义 RESTful 接口和实际代码的映射
module.exports = {
  'GET::/api/v1/data/datasets/(\\d+)/count': 'api/v1/data/datasets/count',
  'DELETE::/api/v1/train/trainJob': 'api/v1/train/trainJobDelete',
};
