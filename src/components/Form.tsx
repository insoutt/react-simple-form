import {
  useForm,
  type SubmitHandler,
  FormProvider,
  type FieldValues,
} from 'react-hook-form';
import {
  type BaseSyntheticEvent,
  type Dispatch,
  type SetStateAction,
  useState,
} from 'react';
import FormField from './FormField.js';
import ClearButton from './ClearButton.js';
import type { FormProps } from '../utils/types.js';
import { cn } from '../utils/utils.js';
import { SimpleFormContext } from '../contexts/simple-form-context.js';

const FormBody = <T extends FieldValues>({
  fields,
  validator,
  beforeSubmit,
  afterSubmit,
  className,
  classNames,
  isLoading,
  onSubmit,
  onClear,
  loadingText,
  hideClearButton,
  validateOnSubmit,
  children,
  defaultValues,
  preprocessors,
  submitText = 'Submit',
  clearText = 'Clear',
  setActiveSubmits,
}: FormProps<T> & {
  setActiveSubmits: Dispatch<SetStateAction<number>>;
}) => {
  loadingText = loadingText || submitText;

  const methods = useForm<T>({
    defaultValues,
  });
  // Fields compare the reset count to forget validations from before a Clear
  const [resetCount, setResetCount] = useState(0);

  const { isSubmitting } = methods.formState;
  const isFormBusy = isLoading || isSubmitting;

  const formSubmit: SubmitHandler<T> = async (values: T) => {
    if (typeof beforeSubmit === 'function') {
      try {
        const before = await beforeSubmit(values);
        if (before === false) {
          return;
        } else if (before !== true) {
          values = before;
        }
      } catch (error) {
        console.warn('beforeSubmit failed, onSubmit skipped:', error);
        return;
      }
    }

    try {
      await onSubmit?.(values);
    } catch (error) {
      console.warn('onSubmit failed, afterSubmit skipped:', error);
      return;
    }

    try {
      await afterSubmit?.(values);
    } catch (error) {
      console.warn('afterSubmit failed:', error);
    }
  };

  // Counted before handleSubmit starts, so a defaultValues change waits for every submit in flight
  const submit = async (event?: BaseSyntheticEvent) => {
    setActiveSubmits((count) => count + 1);
    try {
      await methods.handleSubmit(formSubmit)(event);
    } finally {
      setActiveSubmits((count) => count - 1);
    }
  };

  const clear = () => {
    methods.reset();
    setResetCount((count) => count + 1);
    onClear?.();
  };

  return (
    <SimpleFormContext.Provider
      value={{
        isLoading: !!isFormBusy,
        validateOnSubmit: !!validateOnSubmit,
        validator,
        classNames,
        preprocessors,
        resetCount,
      }}
    >
      <FormProvider {...methods}>
        <form onSubmit={submit} className={className}>
          {fields.map((field) => (
            <FormField<T> key={field.name} {...field} />
          ))}

          {typeof children === 'function' ? (
            children(submit, clear)
          ) : typeof children !== 'undefined' ? (
            children
          ) : (
            <div className="form-action-buttons">
              <button
                className={cn(classNames?.submitButton || 'btn btn-primary')}
                type="submit"
                disabled={isFormBusy}
              >
                {isFormBusy ? loadingText : submitText}
              </button>
              {!hideClearButton && !isFormBusy && (
                <ClearButton
                  className={classNames?.clearButton}
                  onClick={clear}
                >
                  {clearText}
                </ClearButton>
              )}
            </div>
          )}
        </form>
      </FormProvider>
    </SimpleFormContext.Provider>
  );
};

// New defaultValues remount the form with them, so fields they leave out start empty.
// Compared by value, so an inline object re-created on every render keeps the user's edits
const Form = <T extends FieldValues>(props: FormProps<T>) => {
  const [activeSubmits, setActiveSubmits] = useState(0);
  const defaultsKey = JSON.stringify(props.defaultValues);
  // State, not a ref, so a render React discards (a suspended transition) applies nothing
  const [appliedKey, setAppliedKey] = useState(defaultsKey);
  // Submits in flight finish on the form they started on
  if (activeSubmits === 0 && appliedKey !== defaultsKey) {
    setAppliedKey(defaultsKey);
  }

  return (
    <FormBody<T>
      key={appliedKey}
      {...props}
      setActiveSubmits={setActiveSubmits}
    />
  );
};

export default Form;
