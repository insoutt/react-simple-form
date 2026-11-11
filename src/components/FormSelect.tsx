import { useFormContext, type FieldValues } from 'react-hook-form';
import { cn, getFieldClassname, parseValidation } from '../utils/utils.js';
import type { SelectProps } from '../utils/types.js';
import {
  type ChangeEvent,
  type JSX,
  useContext,
  useRef,
  useState,
} from 'react';
import { SimpleFormContext } from '../contexts/simple-form-context.js';

const FormSelect = <T extends FieldValues>({
  label,
  name,
  options,
  validation,
  props,
  labelClassName,
  groupClassName,
  className,
  renderFields,
  children,
}: SelectProps<T>): JSX.Element => {
  const { register, watch, formState, trigger, control } = useFormContext();
  const { isLoading, validator, validateOnSubmit, resetCount } =
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
  const selectedValue = watch(name);

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

  const handleSelectChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    await onChange(event);
    // After a submit, RHF's onChange already revalidates the select
    if (!control._formState.isSubmitted && !validateOnSubmit) {
      await trigger(name);
    }
  };

  const renderInputs = () => {
    const option = options.find(
      (item) => String(item.value) === String(selectedValue),
    );

    if (!option?.fields || typeof renderFields !== 'function') return;

    return option.fields.map((field) => renderFields(field));
  };

  return (
    <>
      <div className={cn(groupClassName || 'form-group')}>
        <label className={labelClassName || 'form-label'} htmlFor={name}>
          {label}
        </label>
        <select
          id={name}
          className={getFieldClassname(name, {
            formState,
            isValidating,
            validateOnSubmit,
            isValidated:
              passed?.resetCount === resetCount &&
              Object.is(passed.value, selectedValue),
            className,
          })}
          {...registration}
          onChange={handleSelectChange}
          {...props}
          disabled={isLoading || formState.isSubmitting || props?.disabled}
        >
          <option value="">N/A</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.text}
            </option>
          ))}
        </select>
        {children}
      </div>

      {renderInputs()}
    </>
  );
};

export default FormSelect;
