import { DefaultValues, FieldValues, Path } from "react-hook-form";

// Form
export type Validator = Record<string, FieldValidator>;
export type OnSubmit<T> = (values: T) => void | Promise<void>;
export type OnClear = () => void;
export type BeforeSubmit<T> = (values: T) => Promise<T | boolean>
export type AfterSubmit<T> = (values: T) => void | Promise<void>
export type Value = string | number;

export interface FormProps<T extends FieldValues> {
    fields: FieldProps<T>[];
    className?: string;
    isLoading?: boolean;
    classNames?: FormClassNames;
    validator?: Validator
    onSubmit?: OnSubmit<T>
    onClear?: OnClear
    preprocessors?: Record<string, Preprocessor>
    loadingText?: string
    submitText?: string
    clearText?: string
    hideClearButton?: boolean
    validateOnSubmit?: boolean
    beforeSubmit?: BeforeSubmit<T>
    afterSubmit?: AfterSubmit<T>
    defaultValues?: DefaultValues<T>;
    children?: React.ReactNode | ((submit: () => void, clear: () => void) => React.ReactElement)
}

export interface FormClassNames{
    select?: string
    input?: string
    field?: string
    group?: string
    label?: string
    submitButton?: string
    clearButton?: string
}

// End Form

// FormField
export type FieldValidator = (value: Value) => (boolean | string | Promise<boolean | string>);
export type Preprocessor = (value: Value, selection: Selection) => Value;

export type Selection = {
    from: number | null
    end: number | null
}

interface FieldBaseAttributes<T extends FieldValues> {
    label?: string;
    helpText?: string;
    name: Path<T>;
    type: InputType | 'select';
    className?: string;
    groupClassName?: string;
    labelClassName?: string;
    children?: React.ReactElement;
    validation?: string | FieldValidator
    preprocessor?: Preprocessor
}

interface FieldBaseProps {
    placeholder?: string
    disabled?: boolean
}

type Fields<T extends FieldValues> = InputProps<T> | SelectProps<T>;

export type FieldProps<T extends FieldValues> = Fields<T>;
// End FormField

// FormInput
export interface InputProps<T extends FieldValues> extends FieldBaseAttributes<T> {
    type: InputType;
    props?: FieldBaseProps
}

export type InputType = 'text' | 'number' | 'email' | 'password' | 'date' | 'time' | 'checkbox' | 'radio' | 'file' | 'hidden' | 'range' | 'color' | 'search' | 'tel' | 'url';
//End FormInput

// FormSelect
export type SelectProps<T extends FieldValues> = {
    type: 'select';
    options: SelectOption<T>[];
    props?: FieldBaseProps;
    renderFields?: (field: FieldProps<T>) => React.ReactNode
} & FieldBaseAttributes<T>;

export type SelectOption<T extends FieldValues> = {
    value: Value;
    text: string;
    fields?: FieldProps<T>[];
}
// End FormSelect


export { FieldValues };
