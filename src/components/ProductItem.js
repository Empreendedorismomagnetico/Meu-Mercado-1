import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function ProductItem({
  product,
  onPress,
  onDelete,
}) {
  const subtotal = product.quantity * product.price;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.info}>
        <Text style={styles.name}>
          {product.name}
        </Text>

        <Text style={styles.details}>
          {product.quantity} x R$ {Number(product.price).toFixed(2)}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.price}>
          R$ {subtotal.toFixed(2)}
        </Text>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(event) => {
            event.stopPropagation();
            onDelete(product.id);
          }}
        >
          <Text style={styles.deleteText}>⋮</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 2,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111111',
  },
  details: {
    fontSize: 13,
    color: '#777777',
    marginTop: 5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111111',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginLeft: 5,
  },
  deleteText: {
    fontSize: 25,
    color: '#555555',
  },
});
