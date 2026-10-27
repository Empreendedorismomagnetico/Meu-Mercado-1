
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export default function TotalCard({ total }) {
  const formattedTotal = Number(total || 0).toFixed(2);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        TOTAL DAS COMPRAS
      </Text>

      <Text style={styles.value}>
        R$ {formattedTotal.replace('.', ',')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 25,
    paddingHorizontal: 15,
    backgroundColor: '#111111',
    borderRadius: 16,
    marginVertical: 15,
  },

  label: {
    color: '#BBBBBB',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },

  value: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: 'bold',
    marginTop: 8,
  },
});
