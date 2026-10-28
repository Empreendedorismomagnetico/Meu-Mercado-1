
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';

import {
  getPurchaseHistory,
  updatePurchaseDetails,
} from '../storage/database';

const COLORS = {
  primary: '#2878D0',
  background: '#F5F7FA',
  white: '#FFFFFF',
  text: '#222222',
  muted: '#777777',
  border: '#E5E7EB',
  green: '#159957',
};

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getPurchaseTotal = (purchase) => {
  if (purchase.total !== undefined) {
    return Number(purchase.total) || 0;
  }

  return (purchase.products || []).reduce((sum, product) => {
    const quantity = Number(product.quantity) || 0;
    const price = Number(product.price) || 0;
    return sum + quantity * price;
  }, 0);
};

const yearSafe = (date, monthOffset) => {
  return new Date(
    date.getFullYear(),
    date.getMonth() + monthOffset,
    1
  );
};

export default function HistoryScreen() {
  const [purchases, setPurchases] = useState([]);
  const [filterMode, setFilterMode] = useState('month');

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date());

  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);

  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [location, setLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [dateSelectionTarget, setDateSelectionTarget] = useState('start');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const result = await getPurchaseHistory();
      setPurchases(Array.isArray(result) ? result : []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o histórico.');
    }
  };
    
  const getPeriod = () => {
    const now = new Date();

    if (filterMode === 'month') {
      return {
        start: new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth(),
          1
        ),
        end: endOfDay(
          new Date(
            selectedMonth.getFullYear(),
            selectedMonth.getMonth() + 1,
            0
          )
        ),
      };
    }

    if (filterMode === 'week') {
      const date = startOfDay(selectedWeekDate);
      const day = date.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const start = addDays(date, mondayOffset);

      return {
        start,
        end: endOfDay(addDays(start, 6)),
      };
    }

    return {
      start: customStart ? startOfDay(customStart) : startOfDay(now),
      end: customEnd ? endOfDay(customEnd) : endOfDay(now),
    };
  };

  const period = getPeriod();

  const filteredPurchases = purchases
    .filter((purchase) => {
      if (!purchase.date) return false;

      const date = new Date(purchase.date);
      return date >= period.start && date <= period.end;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalSpent = filteredPurchases.reduce(
    (sum, purchase) => sum + getPurchaseTotal(purchase),
    0
  );

  const totalDays = Math.max(
    1,
    Math.ceil(
      (period.end.getTime() - period.start.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  const averagePerDay = totalSpent / totalDays;

  const largestPurchase = filteredPurchases.reduce(
    (largest, purchase) => {
      return getPurchaseTotal(purchase) > getPurchaseTotal(largest || {})
        ? purchase
        : largest;
    },
    null
  );

  const monthName = selectedMonth.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  const changeMonth = (amount) => {
    const next = new Date(selectedMonth);
    next.setMonth(next.getMonth() + amount);
    setSelectedMonth(next);
  };

  const changeWeek = (amount) => {
    setSelectedWeekDate((current) => addDays(current, amount * 7));
  };

  const openPurchase = (purchase) => {
    setSelectedPurchase(purchase);
    setLocation(purchase.location || '');
    setPaymentMethod(purchase.paymentMethod || '');
    setNotes(purchase.notes || '');
  };

  const saveDetails = async () => {
    if (!selectedPurchase) return;

    try {
      await updatePurchaseDetails(selectedPurchase.id, {
        location,
        paymentMethod,
        notes,
      });

      setSelectedPurchase({
        ...selectedPurchase,
        location,
        paymentMethod,
        notes,
      });

      await loadHistory();
      Alert.alert('Salvo', 'Os detalhes da compra foram atualizados.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar os detalhes.');
    }
  };

  const openDatePicker = (target) => {
    setDateSelectionTarget(target);

    const currentDate =
      target === 'start'
        ? customStart || new Date()
        : customEnd || customStart || new Date();

    setCalendarMonth(new Date(currentDate));
    setCalendarVisible(true);
  };

  const selectCalendarDate = (day) => {
    const selected = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day
    );

    if (dateSelectionTarget === 'start') {
      setCustomStart(selected);
      setCustomEnd(null);
      setDateSelectionTarget('end');
      return;
    }

    if (customStart && selected < customStart) {
      Alert.alert(
        'Data inválida',
        'A data final não pode ser anterior à data inicial.'
      );
      return;
    }

    setCustomEnd(selected);
    setFilterMode('custom');
    setCalendarVisible(false);
  };

  const selectQuickPeriod = (days) => {
    const today = new Date();
    setCustomEnd(today);
    setCustomStart(addDays(today, -(days - 1)));
    setFilterMode('custom');
  };
  
  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks = Array.from({ length: firstDay }, (_, index) => (
      <View key={`blank-${index}`} style={styles.calendarDay} />
    ));

    const days = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;

      return (
        <TouchableOpacity
          key={day}
          style={styles.calendarDay}
          onPress={() => selectCalendarDate(day)}
        >
          <Text style={styles.calendarDayText}>{day}</Text>
        </TouchableOpacity>
      );
    });

    return (
      <View style={styles.calendarGrid}>
        {blanks}
        {days}
      </View>
    );
  };

  const purchasesByDay = purchases.reduce((groups, purchase) => {
    if (!purchase.date) return groups;

    const date = new Date(purchase.date);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (!groups[key]) groups[key] = [];

    groups[key].push(purchase);
    return groups;
  }, {});

  const renderPurchaseCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return (
      <View style={styles.monthCalendar}>
        <View style={styles.calendarGrid}>
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
            <View key={index} style={styles.calendarDay}>
              <Text style={styles.calendarWeekday}>{day}</Text>
            </View>
          ))}

          {Array.from({ length: firstDay }, (_, index) => (
            <View key={`empty-${index}`} style={styles.calendarDay} />
          ))}

          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const key = `${year}-${month}-${day}`;
            const dayPurchases = purchasesByDay[key] || [];
            const dayTotal = dayPurchases.reduce(
              (sum, purchase) => sum + getPurchaseTotal(purchase),
              0
            );

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.monthDay,
                  dayPurchases.length > 0 && styles.monthDayActive,
                ]}
                onPress={() => {
                  setSelectedWeekDate(new Date(year, month, day));
                  setFilterMode('calendar');
                }}
              >
                <Text style={styles.calendarDayText}>{day}</Text>
                {dayPurchases.length > 0 && (
                  <>
                    <View style={styles.purchaseDot} />
                    <Text style={styles.monthDayTotal}>
                      {dayTotal.toFixed(0)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };
            
  const renderPurchase = (purchase, index) => {
    const total = getPurchaseTotal(purchase);
    const products = purchase.products || [];

    return (
      <TouchableOpacity
        key={purchase.id || index}
        style={styles.purchaseCard}
        onPress={() => openPurchase(purchase)}
      >
        <View style={styles.purchaseHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.purchaseTitle}>
              {purchase.location || `Compra ${index + 1}`}
            </Text>
            <Text style={styles.purchaseDate}>
              {formatDate(purchase.date)}
            </Text>
          </View>

          <Text style={styles.purchaseTotal}>{formatMoney(total)}</Text>
        </View>

        <Text style={styles.productCount}>
          {products.length} {products.length === 1 ? 'produto' : 'produtos'}
        </Text>

        <Text style={styles.detailsLink}>Ver detalhes →</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Meu Histórico</Text>
        <Text style={styles.subtitle}>
          Acompanhe suas compras e seus gastos.
        </Text>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === 'month' && styles.filterButtonActive,
            ]}
            onPress={() => setFilterMode('month')}
          >
            <Text
              style={[
                styles.filterText,
                filterMode === 'month' && styles.filterTextActive,
              ]}
            >
              Mês
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === 'week' && styles.filterButtonActive,
            ]}
            onPress={() => setFilterMode('week')}
          >
            <Text
              style={[
                styles.filterText,
                filterMode === 'week' && styles.filterTextActive,
              ]}
            >
              Semana
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === 'custom' && styles.filterButtonActive,
            ]}
            onPress={() => setFilterMode('custom')}
          >
            <Text
              style={[
                styles.filterText,
                filterMode === 'custom' && styles.filterTextActive,
              ]}
            >
              Personalizado
            </Text>
          </TouchableOpacity>
                          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === 'calendar' && styles.filterButtonActive,
            ]}
            onPress={() => {
              setFilterMode('calendar');
              setCalendarMonth(new Date(selectedMonth));
            }}
          >
            <Text
              style={[
                styles.filterText,
                filterMode === 'calendar' && styles.filterTextActive,
              ]}
            >
              Calendário
            </Text>
          </TouchableOpacity>
        </View>

        {filterMode === 'month' && (
          <View style={styles.periodSelector}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Text style={styles.arrow}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.periodText}>{monthName}</Text>

            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {filterMode === 'week' && (
          <View style={styles.periodSelector}>
            <TouchableOpacity onPress={() => changeWeek(-1)}>
              <Text style={styles.arrow}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.periodText}>
              Semana de {formatDate(period.start)}
            </Text>

            <TouchableOpacity onPress={() => changeWeek(1)}>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {filterMode === 'custom' && (
          <View style={styles.customContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openDatePicker('start')}
            >
              <Text style={styles.dateButtonLabel}>Data inicial</Text>
              <Text style={styles.dateButtonValue}>
                {customStart ? formatDate(customStart) : 'Selecionar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openDatePicker('end')}
            >
              <Text style={styles.dateButtonLabel}>Data final</Text>
              <Text style={styles.dateButtonValue}>
                {customEnd ? formatDate(customEnd) : 'Selecionar'}
              </Text>
            </TouchableOpacity>

            <View style={styles.quickFilters}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => selectQuickPeriod(7)}
              >
                <Text style={styles.quickText}>Últimos 7 dias</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => selectQuickPeriod(30)}
              >
                <Text style={styles.quickText}>Últimos 30 dias</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total gasto no período</Text>
          <Text style={styles.summaryTotal}>{formatMoney(totalSpent)}</Text>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summarySmallLabel}>Compras</Text>
              <Text style={styles.summaryValue}>
                {filteredPurchases.length}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summarySmallLabel}>Média diária</Text>
              <Text style={styles.summaryValue}>
                {formatMoney(averagePerDay)}
              </Text>
            </View>
          </View>

          <View style={styles.largestBox}>
            <Text style={styles.summarySmallLabel}>Maior compra</Text>
            <Text style={styles.largestValue}>
              {largestPurchase
                ? formatMoney(getPurchaseTotal(largestPurchase))
                : formatMoney(0)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Compras realizadas</Text>

        {filteredPurchases.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhuma compra encontrada</Text>
            <Text style={styles.emptyText}>
              Não há compras registradas neste período.
            </Text>
          </View>
        ) : (
          filteredPurchases.map(renderPurchase)
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
              
      <Modal
        visible={calendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.calendarModal}>
            <Text style={styles.modalTitle}>
              {dateSelectionTarget === 'start'
                ? 'Escolha a data inicial'
                : 'Escolha a data final'}
            </Text>

            <View style={styles.periodSelector}>
              <TouchableOpacity
                onPress={() =>
                  setCalendarMonth(yearSafe(calendarMonth, -1))
                }
              >
                <Text style={styles.arrow}>‹</Text>
              </TouchableOpacity>

              <Text style={styles.periodText}>
                {calendarMonth.toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setCalendarMonth(yearSafe(calendarMonth, 1))
                }
              >
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarGrid}>
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(
                (day, index) => (
                  <View key={index} style={styles.calendarDay}>
                    <Text style={styles.calendarWeekday}>{day}</Text>
                  </View>
                )
              )}
            </View>

            {renderCalendar()}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCalendarVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedPurchase}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPurchase(null)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.detailsModal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Detalhes da compra</Text>

              {selectedPurchase && (
                <>
                  <Text style={styles.detailDate}>
                    {formatDate(selectedPurchase.date)}
                  </Text>

                  <Text style={styles.sectionTitle}>Produtos</Text>

                  {(selectedPurchase.products || []).map(
                    (product, index) => (
                      <View key={index} style={styles.productRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.productName}>
                            {product.name || product.title || 'Produto'}
                          </Text>
                          <Text style={styles.productInfo}>
                            Quantidade: {product.quantity || 1}
                          </Text>
                        </View>

                        <Text style={styles.productPrice}>
                          {formatMoney(
                            (Number(product.quantity) || 1) *
                              (Number(product.price) || 0)
                          )}
                        </Text>
                      </View>
                    )
                  )}

                  <Text style={styles.detailTotal}>
                    Total: {formatMoney(getPurchaseTotal(selectedPurchase))}
                  </Text>

                  <Text style={styles.inputLabel}>Local da compra</Text>
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Ex.: Supermercado"
                    placeholderTextColor="#999"
                  />

                  <Text style={styles.inputLabel}>Forma de pagamento</Text>
                  <TextInput
                    style={styles.input}
                    value={paymentMethod}
                    onChangeText={setPaymentMethod}
                    placeholder="Ex.: Pix, dinheiro, cartão"
                    placeholderTextColor="#999"
                  />

                  <Text style={styles.inputLabel}>Observações</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Adicione uma observação..."
                    placeholderTextColor="#999"
                    multiline
                  />

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveDetails}
                  >
                    <Text style={styles.saveButtonText}>
                      Salvar alterações
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedPurchase(null)}
                  >
                    <Text style={styles.closeButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
    marginBottom: 18,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  periodText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  arrow: {
    fontSize: 30,
    color: COLORS.primary,
    paddingHorizontal: 12,
  },
  customContainer: {
    marginBottom: 12,
  },
  dateButton: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  dateButtonLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  dateButtonValue: {
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 4,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#E7F1FC',
    borderRadius: 9,
    alignItems: 'center',
  },
  quickText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 22,
  },
  summaryLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },
  summaryTotal: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 6,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summarySmallLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 5,
  },
  largestBox: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 14,
    paddingTop: 12,
  },
  largestValue: {
    color: COLORS.green,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  purchaseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 13,
    padding: 15,
    marginBottom: 10,
  },
  purchaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  purchaseTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  purchaseDate: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  purchaseTotal: {
    color: COLORS.green,
    fontWeight: 'bold',
    fontSize: 16,
  },
  productCount: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 12,
  },
  detailsLink: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: 22,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  calendarModal: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
  },
  detailsModal: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.2857%',
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    color: COLORS.text,
    fontSize: 14,
  },
  calendarWeekday: {
    color: COLORS.muted,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 13,
    borderRadius: 10,
    backgroundColor: '#E7F1FC',
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  detailDate: {
    color: COLORS.muted,
    marginBottom: 16,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  productName: {
    color: COLORS.text,
    fontWeight: '600',
  },
  productInfo: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },
  productPrice: {
    color: COLORS.text,
    fontWeight: '600',
  },
  detailTotal: {
    color: COLORS.green,
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'right',
    marginVertical: 16,
  },
  inputLabel: {
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 11,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
                                        
