import { Theme } from 'react-native-elements';

export const theme: Theme = {
  colors: {
    primary: '#2E7D32',
    secondary: '#FFC107',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    grey0: '#393939',
    grey1: '#43484D',
    grey2: '#5E6977',
    grey3: '#86939E',
    grey4: '#BDC6CF',
    grey5: '#E1E8EE',
    greyOutline: '#E1E8EE',
    searchBg: '#E1E8EE',
    disabled: '#DADEE0',
    divider: '#E1E8EE',
    platform: {
      ios: {
        primary: '#2E7D32',
        secondary: '#FFC107',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
      },
      android: {
        primary: '#2E7D32',
        secondary: '#FFC107',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
      },
    },
  },
  Button: {
    raised: true,
    buttonStyle: {
      borderRadius: 8,
      paddingVertical: 12,
    },
    titleStyle: {
      fontSize: 16,
      fontWeight: '600',
    },
  },
  Input: {
    containerStyle: {
      paddingHorizontal: 0,
    },
    inputContainerStyle: {
      borderBottomWidth: 1,
      borderBottomColor: '#E1E8EE',
    },
    labelStyle: {
      fontSize: 14,
      color: '#43484D',
      fontWeight: '400',
    },
    inputStyle: {
      fontSize: 16,
    },
  },
  Card: {
    containerStyle: {
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      borderWidth: 0,
    },
  },
  ListItem: {
    containerStyle: {
      paddingVertical: 16,
    },
    titleStyle: {
      fontSize: 16,
      fontWeight: '500',
    },
    subtitleStyle: {
      fontSize: 14,
      color: '#86939E',
    },
  },
  Header: {
    centerComponent: {
      style: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
      },
    },
    backgroundColor: '#2E7D32',
  },
};
