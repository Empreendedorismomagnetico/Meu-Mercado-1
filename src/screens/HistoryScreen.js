import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';

import {
  getPurchaseHistory,
  updatePurchaseDetails,
} from '../storage/database';

const COLORS = {
  primary: '#2878C8',
  background: '#F4F7FB',
  white: '#FFFFFF',
  text: '#263238',
  muted: '#78909C',
  border: '#E0E6ED',
  green: '#2E9D65',
  red: '#E05252',
};

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function yearSafe(date, amount) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + amount,
    1
  );
}

function getPurchaseTotal(purchase) {
  if (purchase.total !== undefined) {
    return Number(purchase.total) || 0;
  }

  return (purchase.products || []).reduce(
    (sum, product) =>
      sum +
      Number(product.quantity || 0) *
      Number(product.price || 0),
    0
  );
}

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

  const [selectedCalendarDate, setSelectedCalendarDate] =
    useState(null);

  useEffect(() => {
    loadPurchases();
  }, []);

  async function loadPurchases() {
    try {
      const data = await getPurchaseHistory();
      setPurchases(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setPurchases([]);
    }
  }

  function getPeriod() {
    if (filterMode === 'month') {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth();

      return {
        start: new Date(year, month, 1),
        end: endOfDay(new Date(year, month + 1, 0)),
      };
    }

    if (filterMode === 'week') {
      const date = startOfDay(selectedWeekDate);
      const day = date.getDay();
      const difference = day === 0 ? -6 : 1 - day;

      const monday = addDays(date, difference);

      return {
        start: startOfDay(monday),
        end: endOfDay(addDays(monday, 6)),
      };
    }

    if (filterMode === 'calendar') {
      if (selectedCalendarDate) {
        return {
          start: startOfDay(selectedCalendarDate),
          end: endOfDay(selectedCalendarDate),
        };
      }

      const year = calendarMonth.getFullYear();
      const month = calendarMonth.getMonth();

      return {
        start: new Date(year, month, 1),
        end: endOfDay(new Date(year, month + 1, 0)),
      };
    }

    return {
      start: customStart
        ? startOfDay(customStart)
        : startOfDay(new Date()),

      end: customEnd
        ? endOfDay(customEnd)
        : endOfDay(new Date()),
    };
  }

  const period = getPeriod();

  const filteredPurchases = purchases.filter((purchase) => {
    if (!purchase.date) return false;

    const purchaseDate = new Date(purchase.date);

    return (
      purchaseDate >= period.start &&
      purchaseDate <= period.end
    );
  });

  const totalSpent = filteredPurchases.reduce(
    (sum, purchase) => sum + getPurchaseTotal(purchase),
    0
  );

  const totalDays = Math.max(
    1,
    Math.ceil(
      (period.end - period.start) / (1000 * 60 * 60 * 24)
    ) + 1
  );

  const averagePerDay = totalSpent / totalDays;

  const largestPurchase = filteredPurchases.reduce(
    (largest, purchase) =>
      getPurchaseTotal(purchase) > getPurchaseTotal(largest)
        ? purchase
        : largest,
    { total: 0 }
  );

  const purchasesByDay = purchases.reduce((groups, purchase) => {
    if (!purchase.date) return groups;

    const date = new Date(purchase.date);

    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(purchase);

    return groups;
  }, {});
    function changeMonth(amount) {
    setSelectedMonth((current) => yearSafe(current, amount));
  }

  function changeWeek(amount) {
    setSelectedWeekDate((current) => addDays(current, amount * 7));
  }

  function openDatePicker(target) {
    setDateSelectionTarget(target);
    setCalendarMonth(
      target === 'start' && customStart
        ? new Date(customStart)
        : target === 'end' && customEnd
        ? new Date(customEnd)
        : new Date()
    );
    setCalendarVisible(true);
  }

  function selectCalendarDate(date) {
    if (dateSelectionTarget === 'start') {
      setCustomStart(date);

      if (customEnd && date > customEnd) {
        setCustomEnd(null);
      }
    } else {
      setCustomEnd(date);
    }

    setCalendarVisible(false);
  }

  function selectQuickPeriod(days) {
    const today = startOfDay(new Date());

    setCustomEnd(today);
    setCustomStart(
      startOfDay(addDays(today, -(days - 1)))
    );
  }

  function openPurchaseDetails(purchase) {
    setSelectedPurchase(purchase);
    setLocation(purchase.location || '');
    setPaymentMethod(purchase.paymentMethod || '');
    setNotes(purchase.notes || '');
  }

  async function savePurchaseDetails() {
    if (!selectedPurchase) return;

    try {
      await updatePurchaseDetails(selectedPurchase.id, {
        location,
        paymentMethod,
        notes,
      });

      await loadPurchases();

      setSelectedPurchase(null);
    } catch (error) {
      console.error('Erro ao salvar detalhes:', error);
    }
  }

  function renderCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    return (
      <View>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            onPress={() =>
              setCalendarMonth((current) => yearSafe(current, -1))
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
              setCalendarMonth((current) => yearSafe(current, 1))
            }
          >
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calendarGrid}>
          {weekdays.map((day, index) => (
            <View key={index} style={styles.calendarDay}>
              <Text style={styles.calendarWeekday}>{day}</Text>
            </View>
          ))}

          {Array.from({ length: firstDay }).map((_, index) => (
            <View key={`empty-${index}`} style={styles.calendarDay} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;

            return (
              <TouchableOpacity
                key={day}
                style={styles.calendarDay}
                onPress={() =>
                  selectCalendarDate(new Date(year, month, day))
                }
              >
                <Text style={styles.calendarDayText}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  function renderPurchaseCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    return (
      <View style={styles.monthCalendar}>
        <View style={styles.calendarGrid}>
          {weekdays.map((day, index) => (
            <View key={index} style={styles.monthDay}>
              <Text style={styles.calendarWeekday}>{day}</Text>
            </View>
          ))}

          {Array.from({ length: firstDay }).map((_, index) => (
            <View
              key={`empty-${index}`}
              style={styles.monthDay}
            />
          ))}

          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;

            const key = `${year}-${month}-${day}`;

            const dayPurchases = purchasesByDay[key] || [];

            const dayTotal = dayPurchases.reduce(
              (sum, purchase) =>
                sum + getPurchaseTotal(purchase),
              0
            );

            const isSelected =
              selectedCalendarDate &&
              selectedCalendarDate.getFullYear() === year &&
              selectedCalendarDate.getMonth() === month &&
              selectedCalendarDate.getDate() === day;

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.monthDay,
                  isSelected && styles.monthDayActive,
                ]}
                onPress={() => {
                  setSelectedCalendarDate(
                    new Date(year, month, day)
                  );
                }}
              >
                <Text
                  style={[
                    styles.monthDayText,
                    isSelected && styles.monthDayTextActive,
                  ]}
                >
                  {day}
                </Text>

                {dayPurchases.length > 0 && (
                  <>
                    <View style={styles.purchaseDot} />

                    <Text style={styles.monthDayTotal}>
                      {Math.round(dayTotal)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.calendarLegend}>
          Os valores abaixo dos dias representam gastos em reais.
        </Text>

        {selectedCalendarDate && (
          <TouchableOpacity
            style={styles.clearCalendarSelection}
            onPress={() => setSelectedCalendarDate(null)}
          >
            <Text style={styles.clearCalendarSelectionText}>
              Ver mês inteiro
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  function renderPurchase(purchase) {
    const products = purchase.products || [];

    return (
      <View key={purchase.id} style={styles.purchaseCard}>
        <View style={styles.purchaseHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.purchaseTitle}>
              Compra
            </Text>

            <Text style={styles.purchaseDate}>
              {formatDate(purchase.date)}
            </Text>
          </View>

          <Text style={styles.purchaseTotal}>
            {formatMoney(getPurchaseTotal(purchase))}
          </Text>
        </View>

        <Text style={styles.productCount}>
          {products.length}{' '}
          {products.length === 1 ? 'produto' : 'produtos'}
        </Text>

        <TouchableOpacity
          onPress={() => openPurchaseDetails(purchase)}
        >
          <Text style={styles.detailsLink}>
            Ver detalhes e editar
          </Text>
        </TouchableOpacity>
      </View>
    );
      }
  return (
    <View style={styles.container}>
      <ScrollView
  showsVerticalScrollIndicator={false}
  contentContainerStyle={styles.scrollContent}
>
        <Text style={styles.pageTitle}>Histórico</Text>

        <Text style={styles.subtitle}>
          Acompanhe suas compras e seus gastos.
        </Text>

        {/* FILTROS */}
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
              setCalendarMonth(new Date(selectedMonth));
              setSelectedCalendarDate(null);
              setFilterMode('calendar');
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

        {/* FILTRO MENSAL */}
        {filterMode === 'month' && (
          <View style={styles.periodSelector}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Text style={styles.arrow}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.periodText}>
              {selectedMonth.toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>

            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* FILTRO SEMANAL */}
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

        {/* FILTRO PERSONALIZADO */}
        {filterMode === 'custom' && (
          <View style={styles.customContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openDatePicker('start')}
            >
              <Text style={styles.dateButtonLabel}>
                Data inicial
              </Text>

              <Text style={styles.dateButtonValue}>
                {customStart
                  ? formatDate(customStart)
                  : 'Selecionar data'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openDatePicker('end')}
            >
              <Text style={styles.dateButtonLabel}>
                Data final
              </Text>

              <Text style={styles.dateButtonValue}>
                {customEnd
                  ? formatDate(customEnd)
                  : 'Selecionar data'}
              </Text>
            </TouchableOpacity>

            <View style={styles.quickFilters}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => selectQuickPeriod(7)}
              >
                <Text style={styles.quickText}>7 dias</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => selectQuickPeriod(15)}
              >
                <Text style={styles.quickText}>15 dias</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => selectQuickPeriod(30)}
              >
                <Text style={styles.quickText}>30 dias</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* CALENDÁRIO MENSAL */}
        {filterMode === 'calendar' && (
          <View>
            <View style={styles.periodSelector}>
              <TouchableOpacity
                onPress={() => {
                  setCalendarMonth((current) =>
                    yearSafe(current, -1)
                  );
                  setSelectedCalendarDate(null);
                }}
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
                onPress={() => {
                  setCalendarMonth((current) =>
                    yearSafe(current, 1)
                  );
                  setSelectedCalendarDate(null);
                }}
              >
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            </View>

            {renderPurchaseCalendar()}
          </View>
        )}

        {/* RESUMO */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            Total gasto no período
          </Text>

          <Text style={styles.summaryTotal}>
            {formatMoney(totalSpent)}
          </Text>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summarySmallLabel}>
                Compras
              </Text>

              <Text style={styles.summaryValue}>
                {filteredPurchases.length}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summarySmallLabel}>
                Média por dia
              </Text>

              <Text style={styles.summaryValue}>
                {formatMoney(averagePerDay)}
              </Text>
            </View>
          </View>

          <View style={styles.largestBox}>
            <Text style={styles.summarySmallLabel}>
              Maior compra
            </Text>

            <Text style={styles.largestValue}>
              {formatMoney(getPurchaseTotal(largestPurchase))}
            </Text>
          </View>
        </View>

        {/* LISTA DE COMPRAS */}
        <Text style={styles.sectionTitle}>
          {filterMode === 'calendar' && selectedCalendarDate
            ? `Compras de ${formatDate(selectedCalendarDate)}`
            : 'Compras realizadas'}
        </Text>

        {filteredPurchases.length > 0 ? (
          filteredPurchases.map(renderPurchase)
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Nenhuma compra encontrada
            </Text>

            <Text style={styles.emptyText}>
              Não existem compras registradas neste período.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* MODAL DE SELEÇÃO DE DATA */}
      <Modal
        visible={calendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.calendarModal}>
            <Text style={styles.modalTitle}>
              Selecionar data
            </Text>

            {renderCalendar()}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCalendarVisible(false)}
            >
              <Text style={styles.closeButtonText}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE DETALHES DA COMPRA */}
      <Modal
        visible={!!selectedPurchase}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPurchase(null)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.detailsModal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                Detalhes da compra
              </Text>

              {selectedPurchase && (
                <>
                  <Text style={styles.detailDate}>
                    {formatDate(selectedPurchase.date)}
                  </Text>

                  {(selectedPurchase.products || []).map(
                    (product, index) => (
                      <View
                        key={`${index}`}
                        style={styles.productRow}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.productName}>
                            {product.name}
                          </Text>

                          <Text style={styles.productInfo}>
                            {product.quantity} x{' '}
                            {formatMoney(product.price)}
                          </Text>
                        </View>

                        <Text style={styles.productPrice}>
                          {formatMoney(
                            Number(product.quantity) *
                              Number(product.price)
                          )}
                        </Text>
                      </View>
                    )
                  )}

                  <Text style={styles.detailTotal}>
                    Total: {formatMoney(
                      getPurchaseTotal(selectedPurchase)
                    )}
                  </Text>

                  <Text style={styles.inputLabel}>
                    Local da compra
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Ex.: Supermercado"
                    placeholderTextColor={COLORS.muted}
                  />

                  <Text style={styles.inputLabel}>
                    Forma de pagamento
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={paymentMethod}
                    onChangeText={setPaymentMethod}
                    placeholder="Ex.: Dinheiro, Pix ou cartão"
                    placeholderTextColor={COLORS.muted}
                  />

                  <Text style={styles.inputLabel}>
                    Observações
                  </Text>

                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Adicione uma observação..."
                    placeholderTextColor={COLORS.muted}
                    multiline
                  />

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={savePurchaseDetails}
                  >
                    <Text style={styles.saveButtonText}>
                      Salvar alterações
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedPurchase(null)}
                  >
                    <Text style={styles.closeButtonText}>
                      Fechar
                    </Text>
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
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },

  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },

  filterText: {
    color: COLORS.muted,
    fontSize: 10,
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

  monthCalendar: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 8,
    marginBottom: 18,
  },

  monthDay: {
    width: '14.2857%',
    minHeight: 58,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 4,
  },

  monthDayActive: {
    backgroundColor: '#DCEBFA',
  },

  monthDayText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },

  monthDayTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },

  purchaseDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.green,
    marginTop: 2,
  },

  monthDayTotal: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2,
  },

  calendarLegend: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 6,
  },

  clearCalendarSelection: {
    alignItems: 'center',
    padding: 10,
    marginTop: 4,
  },

  clearCalendarSelectionText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
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
