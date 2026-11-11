import type { DefaultValues, FieldValues, Path } from 'react-hook-form';

// Form
export type Validator = Record<string, FieldValidator>;
export type OnSubmit<T> = (values: T) => void | Promise<void>;
export type OnClear = () => void;
export type BeforeSubmit<T> = (values: T) => Promise<T | boolean>;
export type AfterSubmit<T> = (values: T) => void | Promise<void>;
export type Value = string | number;

export interface FormProps<T extends FieldValues> {
  fields: FieldProps<T>[];
  className?: string;
  isLoading?: boolean;
  classNames?: FormClassNames;
  validator?: Validator;
  onSubmit?: OnSubmit<T>;
  onClear?: OnClear;
  preprocessors?: Record<string, Preprocessor>;
  loadingText?: string;
  submitText?: string;
  clearText?: string;
  hideClearButton?: boolean;
  validateOnSubmit?: boolean;
  beforeSubmit?: BeforeSubmit<T>;
  afterSubmit?: AfterSubmit<T>;
  defaultValues?: DefaultValues<T>;
  children?:
    | React.ReactNode
    | ((submit: () => void, clear: () => void) => React.ReactElement);
}

export interface FormClassNames {
  select?: string;
  input?: string;
  field?: string;
  group?: string;
  label?: string;
  submitButton?: string;
  clearButton?: string;
}

// End Form

// FormField
// Method syntax keeps parameters bivariant, so the form-level validator record takes a validator declared for any field type
export type FieldValidator<V = Value | boolean | FileList> = {
  bivarianceHack(value: V): boolean | string | Promise<boolean | string>;
}['bivarianceHack'];
export type Preprocessor = (value: Value, selection: Selection) => Value;

export type Selection = {
  from: number | null;
  end: number | null;
};

interface FieldBaseAttributes<T extends FieldValues> {
  label?: string;
  helpText?: string;
  name: Path<T>;
  type: InputType | 'select';
  className?: string;
  groupClassName?: string;
  labelClassName?: string;
  children?: React.ReactElement;
  preprocessor?: Preprocessor;
}

// Attributes the components set themselves are left out, the props spread would override them
type ManagedAttributes =
  | 'name'
  | 'id'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onBlur'
  | 'className'
  | 'children';

type InputAttributes = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  ManagedAttributes | 'type' | 'checked' | 'defaultChecked'
>;

type SelectAttributes = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  ManagedAttributes | 'multiple'
> & {
  // Kept from the previous props type, a select has no placeholder attribute
  placeholder?: string;
};

// One member per input type, so `type` picks the value its validation receives
type Fields<T extends FieldValues> =
  { [K in InputType]: InputProps<T, K> }[InputType] | SelectProps<T>;

export type FieldProps<T extends FieldValues> = Fields<T>;
// End FormField

// FormInput
export interface InputProps<
  T extends FieldValues,
  K extends InputType = InputType,
> extends FieldBaseAttributes<T> {
  type: K;
  props?: InputAttributes;
  validation?: string | FieldValidator<InputValue<K>>;
}

type InputValue<K extends InputType> = K extends 'checkbox'
  ? boolean
  : K extends 'file'
    ? FileList
    : Value;

export type InputType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'date'
  | 'time'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'hidden'
  | 'range'
  | 'color'
  | 'search'
  | 'tel'
  | 'url';
//End FormInput

// FormSelect
export type SelectProps<T extends FieldValues> = {
  type: 'select';
  options: SelectOption<T>[];
  props?: SelectAttributes;
  validation?: string | FieldValidator<Value>;
  renderFields?: (field: FieldProps<T>) => React.ReactNode;
} & FieldBaseAttributes<T>;

export type SelectOption<T extends FieldValues> = {
  value: Value;
  text: string;
  fields?: FieldProps<T>[];
};
// End FormSelect

export type { FieldValues };
