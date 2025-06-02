import React from 'react';
import { Input, InputProps } from 'react-native-elements';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { StyleSheet } from 'react-native';

interface FormInputProps<T extends FieldValues> extends Omit<InputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: Path<T>;
  rules?: any;
}

function FormInput<T extends FieldValues>({
  control,
  name,
  rules,
  ...inputProps
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <Input
          {...inputProps}
          onBlur={onBlur}
          onChangeText={onChange}
          value={value}
          errorMessage={error?.message}
          errorStyle={styles.errorText}
          inputContainerStyle={[
            styles.inputContainer,
            error && styles.inputContainerError,
            inputProps.inputContainerStyle,
          ]}
          labelStyle={[styles.label, inputProps.labelStyle]}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  inputContainerError: {
    borderBottomColor: '#F44336',
  },
  label: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 3,
  },
});

export default FormInput;
