import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { HandicapTrend, PeerComparison } from '../../types/handicap';

const screenWidth = Dimensions.get('window').width;

interface HandicapChartProps {
  type: 'trend' | 'comparison' | 'distribution';
  data: HandicapTrend[] | PeerComparison[] | any;
  title?: string;
  height?: number;
  showLegend?: boolean;
}

const HandicapChart: React.FC<HandicapChartProps> = ({
  type,
  data,
  title,
  height = 220,
  showLegend = true,
}) => {
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#007AFF',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#E0E0E0',
      strokeWidth: 1,
    },
  };

  const renderTrendChart = () => {
    const trendData = data as HandicapTrend[];

    if (!trendData || trendData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No trend data available</Text>
        </View>
      );
    }

    const chartData = {
      labels: trendData.slice(-6).map((item) => {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [
        {
          data: trendData.slice(-6).map((item) => item.handicapIndex),
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={height}
        chartConfig={chartConfig}
        style={styles.chart}
        bezier
        yAxisSuffix=""
        yAxisInterval={1}
        formatYLabel={(value) => value.toString()}
        withInnerLines={true}
        withOuterLines={true}
        withDots={true}
        withShadow={false}
      />
    );
  };

  const renderComparisonChart = () => {
    const comparisonData = data as PeerComparison[];

    if (!comparisonData || comparisonData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No comparison data available</Text>
        </View>
      );
    }

    const chartData = {
      labels: comparisonData.slice(0, 5).map((item) => item.memberName.split(' ')[0]),
      datasets: [
        {
          data: comparisonData.slice(0, 5).map((item) => item.handicapIndex),
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        },
      ],
    };

    return (
      <BarChart
        data={chartData}
        width={screenWidth - 32}
        height={height}
        chartConfig={chartConfig}
        style={styles.chart}
        yAxisSuffix=""
        yAxisInterval={1}
        fromZero={true}
        showValuesOnTopOfBars={true}
      />
    );
  };

  const renderDistributionChart = () => {
    const distributionData = data;

    if (!distributionData || distributionData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No distribution data available</Text>
        </View>
      );
    }

    const pieData = distributionData.map((item: any, index: number) => ({
      name: item.name,
      value: item.value,
      color: getColorForIndex(index),
      legendFontColor: '#333333',
      legendFontSize: 12,
    }));

    return (
      <PieChart
        data={pieData}
        width={screenWidth - 32}
        height={height}
        chartConfig={chartConfig}
        accessor="value"
        backgroundColor="transparent"
        paddingLeft="15"
        center={[10, 0]}
        style={styles.chart}
      />
    );
  };

  const getColorForIndex = (index: number): string => {
    const colors = [
      '#007AFF',
      '#FF3B30',
      '#34C759',
      '#FF9500',
      '#AF52DE',
      '#FF2D92',
      '#5AC8FA',
      '#FFCC00',
    ];
    return colors[index % colors.length];
  };

  const renderChart = () => {
    switch (type) {
      case 'trend':
        return renderTrendChart();
      case 'comparison':
        return renderComparisonChart();
      case 'distribution':
        return renderDistributionChart();
      default:
        return null;
    }
  };

  const renderLegend = () => {
    if (!showLegend || type !== 'trend') {
      return null;
    }

    const trendData = data as HandicapTrend[];
    if (!trendData || trendData.length === 0) {
      return null;
    }

    const latestTrend = trendData[trendData.length - 1];
    const previousTrend = trendData[trendData.length - 2];

    if (!latestTrend || !previousTrend) {
      return null;
    }

    const change = latestTrend.handicapIndex - previousTrend.handicapIndex;
    const isImproving = change < 0;

    return (
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#007AFF' }]} />
          <Text style={styles.legendText}>Handicap Index</Text>
        </View>
        <View style={styles.trendIndicator}>
          <Text style={[styles.trendText, { color: isImproving ? '#34C759' : '#FF3B30' }]}>
            {isImproving ? '↓' : '↑'} {Math.abs(change).toFixed(1)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {renderChart()}
      {renderLegend()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  noDataText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#333333',
  },
  trendIndicator: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default HandicapChart;
