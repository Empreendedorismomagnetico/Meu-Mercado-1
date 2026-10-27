
import React, { useState } from 'react';

import {
  View,
  ScrollView,
  Dimensions,
  StatusBar,
  StyleSheet,
} from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const [historyKey, setHistoryKey] = useState(0);

  function handlePageChange(event) {
    const position = event.nativeEvent.contentOffset.x;
    const page = Math.round(position / SCREEN_WIDTH);

    if (page !== currentPage) {
      setCurrentPage(page);

      if (page === 1) {
        setHistoryKey(value => value + 1);
      }
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#FFFFFF"
        barStyle="dark-content"
      />

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePageChange}
        nestedScrollEnabled
      >
        <View style={styles.page}>
          <HomeScreen />
        </View>

        <View style={styles.page}>
          <HistoryScreen key={historyKey} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
});
