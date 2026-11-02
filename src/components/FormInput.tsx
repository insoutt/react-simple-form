import { useFormContext, FieldValues } from "react-hook-form"
import { cn, getFieldClassname, parseValidation } from "../utils/utils";
import { InputProps } from "../utils/types";
import { ChangeEvent, useContext, useState } from "react";
import { SimpleFormContext } from "../contexts/simple-form-context";


const FormInput = <T extends FieldValues>({ label, name, type, className, validation, props, groupClassName, labelClassName, children, preprocessor }: InputProps<T>): JSX.Element => {
    const { register, formState, setValue, trigger, control } = useFormContext();
    const {isLoading, validator, validateOnSubmit, preprocessors} = useContext(SimpleFormContext);
    const [isValidating, setValidating] = useState(false);

    const validate = async (value: string | number) => {
        if(props?.disabled) return true;
        setValidating(true);
        const validationResponse = await parseValidation(value, validation, validator);
        setValidating(false);
        return validationResponse;
    };

    const { onChange, ...registration } = register(name, { validate });

    const handleInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked } = event.target;
        let auxValue: string | number | boolean = type === 'checkbox' ? checked : value;

        if(type === 'checkbox') {
            // Preprocessors take and return string | number, a checkbox stores its checked boolean as-is
        } else if(typeof preprocessor === 'function') {
            auxValue = preprocessor(value, {
                from: event.target.selectionStart,
                end: event.target.selectionEnd,
            });
        } else if(typeof preprocessors !== 'undefined' && typeof preprocessors[name] === 'function') {
            auxValue = preprocessors[name](value, {
                from: event.target.selectionStart,
                end: event.target.selectionEnd,
            })
        }

        if(type === 'file') {
            // setValue would clear the file selection, RHF's onChange stores `files` instead
            await onChange(event);
        } else {
            setValue(name, auxValue, { shouldDirty: true, shouldTouch: true });
        }
        // control._formState is current at call time, like the isSubmitted RHF's own onChange reads.
        // After a submit, RHF's onChange already revalidates file inputs
        if(control._formState.isSubmitted ? type !== 'file' : ! validateOnSubmit) {
            await trigger(name);
        }
    };

    return <div className={cn(groupClassName || 'form-group')}>
        {label && <label className={labelClassName || 'form-label'} htmlFor={name}>{label}</label>}
        <input id={name}
            type={type}
            {...registration}
            onChange={handleInputChange}
            className={getFieldClassname(name, {
                    formState,
                    isValidating,
                    validateOnSubmit,
                    className
                })
            }
            {...props}
            disabled={isLoading || formState.isSubmitting || props?.disabled}
        />
        {children}
    </div>
  }

  export default FormInput;