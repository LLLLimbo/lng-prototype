import type { ThemeConfig } from 'antd'

export const lngTheme: ThemeConfig = {
  token: {
    colorPrimary: '#0052CC',
    colorSuccess: '#36B37E',
    colorWarning: '#FFAB00',
    colorError: '#FF5630',
    colorInfo: '#00B8D9',
    colorTextBase: '#42526E',
    colorBgLayout: '#F4F5F7',
    borderRadius: 4,
    fontFamily:
      '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Roboto", sans-serif',
  },
  components: {
    Menu: {
      darkItemBg: '#091E42',
      darkSubMenuItemBg: '#0A2744',
      darkItemHoverBg: '#0052CC',
      darkItemSelectedBg: '#0052CC',
    },
    Layout: {
      siderBg: '#091E42',
      bodyBg: '#F4F5F7',
      headerBg: '#FFFFFF',
      triggerBg: '#091E42',
    },
    Table: {
      headerBg: '#F4F5F7',
      rowHoverBg: '#E6F0FF',
      headerColor: '#42526E',
    },
    Button: {
      controlHeightLG: 44,
    },
  },
}
