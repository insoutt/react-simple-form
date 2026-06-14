import { useFormContext, FieldValues } from "react-hook-form"
import { cn, getFieldClassname, parseValidation } from "../utils/utils";
import { InputProps } from "../utils/types";
import { ChangeEvent, useContext, useState } from "react";
import { SimpleFormContext } from "../contexts/simple-form-context";


const FormInput = <T extends FieldValues>({ label, name, type, className, validation, props, groupClassName, labelClassName, children, preprocessor }: InputProps<T>): JSX.Element => {
    const { register, formState, setValue, trigger } = useFormContext();
    const {isLoading, validator, validateOnSubmit, preprocessors} = useContext(SimpleFormContext);
    const [isValidating, setValidating] = useState(false);

    const validate = async (value: string | number) => {
        setValidating(true);
        const validationResponse = await parseValidation(value, formState, validateOnSubmit, validation, validator);
        setValidating(false);
        return validationResponse;
    };

    const handleInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        let auxValue: string | number = value;

        if(typeof preprocessor === 'function') {
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

        setValue(name, auxValue, { shouldDirty: true, shouldTouch: true });
        if(! validateOnSubmit) {
            await trigger(name);
        }
    };

    return <div className={cn(groupClassName || 'form-group')}>
        {label && <label className={labelClassName || 'form-label'} htmlFor={name}>{label}</label>}
        <input id={name}
            type={type}
            disabled={isLoading || formState.isSubmitting}
            {...register(name, { validate })}
            onChange={handleInputChange}
            className={getFieldClassname(name, {
                    formState,
                    isValidating,
                    validateOnSubmit,
                    className
                })
            }
            {...props}
        />
        {children}
    </div>
  }

  export default FormInput;