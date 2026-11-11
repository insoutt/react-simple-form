import { useFormContext, type FieldValues } from 'react-hook-form';
import { cn, getFieldClassname, parseValidation } from '../utils/utils.js';
import type { InputProps, PreprocessorResult } from '../utils/types.js';
import {
  type ChangeEvent,
  type JSX,
  useContext,
  useRef,
  useState,
} from 'react';
import { SimpleFormContext } from '../contexts/simple-form-context.js';

const FormInput = <T extends FieldValues>({
  label,
  name,
  type,
  className,
  validation,
  props,
  groupClassName,
  labelClassName,
  children,
  preprocessor,
}: InputProps<T>): JSX.Element => {
  const { register, formState, setValue, trigger, control, getValues } =
    useFormContext();
  const { isLoading, validator, validateOnSubmit, preprocessors, resetCount } =
    useContext(SimpleFormContext);
  const [isValidating, setValidating] = useState(false);
  // The last value that passed since the last Clear, -valid shows only while the field still holds it
  const [passed, setPassed] = useState<{
    value: unknown;
    resetCount: number;
  } | null>(null);
  const latest = useRef<
    { value: string | number; result: Promise<string | boolean> } | undefined
  >(undefined);

  const validate = async (value: string | number) => {
    if (props?.disabled) return true;
    // RHF can call validate while another field renders, so set state after a microtask
    await Promise.resolve();
    setValidating(true);
    let call = {
      value,
      result: parseValidation(value, validation, validator),
    };
    latest.current = call;
    let validationResponse = await call.result;
    // An older call returns the newest call's result, so RHF keeps it whichever resolves last
    while (latest.current !== call) {
      call = latest.current;
      validationResponse = await call.result;
    }
    setPassed(
      validationResponse === true ? { value: call.value, resetCount } : null,
    );
    setValidating(false);
    return validationResponse;
  };

  const { onChange, ...registration } = register(name, { validate });

  const handleInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = event.target;
    let auxValue: string | number | boolean =
      type === 'checkbox' ? checked : value;

    let processed: PreprocessorResult | undefined;
    if (type === 'checkbox') {
      // Preprocessors take and return string | number, a checkbox stores its checked boolean as-is
    } else if (typeof preprocessor === 'function') {
      processed = preprocessor(value, {
        from: event.target.selectionStart,
        end: event.target.selectionEnd,
      });
    } else if (
      typeof preprocessors !== 'undefined' &&
      typeof preprocessors[name] === 'function'
    ) {
      processed = preprocessors[name]!(value, {
        from: event.target.selectionStart,
        end: event.target.selectionEnd,
      });
    }
    let selection: { from: number; end: number } | undefined;
    if (typeof processed === 'object') {
      auxValue = processed.value;
      selection = processed.selection;
    } else if (processed !== undefined) {
      auxValue = processed;
    }

    if (type === 'file') {
      // setValue would clear the file selection, RHF's onChange stores `files` instead
      await onChange(event);
    } else {
      const { selectionStart, selectionEnd } = event.target;
      setValue(name, auxValue, { shouldDirty: true, shouldTouch: true });
      // Rewriting the DOM value moves the caret to the end; selectionStart is null on types without selection support
      if (
        (selection || auxValue !== value) &&
        selectionStart !== null &&
        document.activeElement === event.target
      ) {
        const len = String(auxValue).length;
        const from = selection?.from ?? selectionStart;
        const end = selection?.end ?? selectionEnd ?? selectionStart;
        event.target.setSelectionRange(Math.min(from, len), Math.min(end, len));
      }
    }
    // control._formState is current at call time, like the isSubmitted RHF's own onChange reads.
    // After a submit, RHF's onChange already revalidates file inputs
    if (control._formState.isSubmitted ? type !== 'file' : !validateOnSubmit) {
      await trigger(name);
    }
  };

  return (
    <div className={cn(groupClassName || 'form-group')}>
      {label && (
        <label className={labelClassName || 'form-label'} htmlFor={name}>
          {label}
        </label>
      )}
      <input
        id={name}
        type={type}
        {...registration}
        onChange={handleInputChange}
        className={getFieldClassname(name, {
          formState,
          isValidating,
          validateOnSubmit,
          isValidated:
            passed?.resetCount === resetCount &&
            Object.is(passed.value, getValues(name)),
          className,
        })}
        {...props}
        disabled={isLoading || formState.isSubmitting || props?.disabled}
      />
      {children}
    </div>
  );
};

export default FormInput;
