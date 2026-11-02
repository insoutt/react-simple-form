import {
  useForm,
  type SubmitHandler,
  FormProvider,
  type FieldValues,
} from 'react-hook-form';
import FormField from './FormField.js';
import ClearButton from './ClearButton.js';
import type { FormProps } from '../utils/types.js';
import { cn } from '../utils/utils.js';
import { SimpleFormContext } from '../contexts/simple-form-context.js';

const Form = <T extends FieldValues>({
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
}: FormProps<T>) => {
  loadingText = loadingText || submitText;

  const methods = useForm<T>({
    defaultValues,
  });

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

  const clear = () => {
    methods.reset();
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
      }}
    >
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(formSubmit)} className={className}>
          {fields.map((field) => (
            <FormField<T> key={field.name} {...field} />
          ))}

          {typeof children === 'function' ? (
            children(methods.handleSubmit(formSubmit), clear)
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

export default Form;
