
import React, { useState, useRef } from 'react';

import {
  View,
  ScrollView,
  Dimensions,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const [historyKey, setHistoryKey] = useState(0);
  const scrollRef = useRef(null);

  function navigateTo(page) {
    scrollRef.current?.scrollTo({
      x: page * SCREEN_WIDTH,
      animated: true,
    });

    setCurrentPage(page);

    if (page === 1) {
      setHistoryKey(value => value + 1);
    }
  }

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        backgroundColor="#FFFFFF"
        barStyle="dark-content"
      />

      <View style={styles.container}>
        <View style={styles.navigationContainer}>
          <View style={styles.navigation}>
            <TouchableOpacity
              style={[
                styles.navButton,
                currentPage === 0 && styles.activeButton,
              ]}
              onPress={() => navigateTo(0)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.navText,
                currentPage === 0 && styles.activeText,
              ]}>
                Compras
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                currentPage === 1 && styles.activeButton,
              ]}
              onPress={() => navigateTo(1)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.navText,
                currentPage === 1 && styles.activeText,
              ]}>
                Histórico
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  navigationContainer: {
    paddingHorizontal: 35,
    paddingTop: 43,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },

  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5D5D5',
    borderRadius: 30,
    padding: 3,
    backgroundColor: '#FFFFFF',
  },

  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  activeButton: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },

  navText: {
    color: '#777777',
    fontSize: 15,
    fontWeight: '600',
  },

  activeText: {
    color: '#FFFFFF',
  },

  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
});
                
