import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { AppProvider } from '@/store/AppContext';
import { initMockData } from '@/data/mockData';
// 全局样式
import './app.scss';

function App(props) {
  useEffect(() => {
    initMockData();
    console.log('[App] Initialized');
  }, []);

  useDidShow(() => {
    console.log('[App] Show');
  });

  useDidHide(() => {
    console.log('[App] Hide');
  });

  return (
    <AppProvider>
      {props.children}
    </AppProvider>
  );
}

export default App;
