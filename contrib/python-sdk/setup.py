from setuptools import setup

setup(name='opensourceaisdk',
      version='0.4.00',
      description='A simple SDK for opensourceai',
      url='https://github.com/opensource-china/pai/contrib/python-sdk',
      packages=['opensourceaisdk'],
      install_requires=[
          'requests', 'hdfs', 'PyYAML', 'requests-toolbelt', 'html2text', 'tabulate'
      ],
      entry_points={
          'console_scripts': ['opai=opensourceaisdk.command_line:main'],
      },
      zip_safe=False
      )
