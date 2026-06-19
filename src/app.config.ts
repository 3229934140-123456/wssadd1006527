export default defineAppConfig({
  pages: [
    'pages/register/index',
    'pages/treatment/index',
    'pages/summary/index',
    'pages/student-detail/index',
    'pages/export-preview/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1677ff',
    navigationBarTitleText: '窝沟封闭登记',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f5f7fa'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#1677ff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/register/index',
        text: '扫码建档'
      },
      {
        pagePath: 'pages/treatment/index',
        text: '现场封闭'
      },
      {
        pagePath: 'pages/summary/index',
        text: '汇总交接'
      }
    ]
  }
})
