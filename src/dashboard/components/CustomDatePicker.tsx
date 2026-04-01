import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

type CustomDatePickerProps = {
  label?: string;
  value?: Dayjs | null;
  onChange?: (value: Dayjs | null) => void;
};

export default function CustomDatePicker({
  label = 'Select date',
  value = dayjs(),
  onChange,
}: CustomDatePickerProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label}
        value={value}
        onChange={onChange}
        enableAccessibleFieldDOMStructure={false}
        slotProps={{
          textField: {
            fullWidth: true,
            size: 'small',
          },
        }}
      />
    </LocalizationProvider>
  );
}