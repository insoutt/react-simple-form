import { useFormContext, FieldValues } from "react-hook-form"
import { cn, getFieldClassname, parseValidation } from '../utils/utils';
import { SelectProps } from "../utils/types";
import { useContext, useState } from "react";
import { SimpleFormContext } from "../contexts/simple-form-context";

const FormSelect = <T extends FieldValues>({ label, name, options, validation, props, labelClassName, groupClassName, className, renderFields, children }: SelectProps<T>): JSX.Element => {
    const { register, watch, formState } = useFormContext();
    const {isLoading, validator, validateOnSubmit} = useContext(SimpleFormContext);
    const [isValidating, setValidating] = useState(false);
    const selectedValue = watch(name);
    
    const validate = async (value: string | number) => {
        setValidating(true);
        const validationResponse = await parseValidation(value, formState, validateOnSubmit, validation, validator);
        setValidating(false);
        return validationResponse;
    };

    const renderInputs = () => {
        const option = options.find(item => item.value === selectedValue);

        if(!option?.fields || typeof renderFields !== 'function') return;

        return option.fields.map(field => renderFields(field));
    }

    return <>
        <div className={cn(groupClassName || 'form-group')}>
            <label className={labelClassName || 'form-label'} htmlFor={name}>{label}</label>
            <select id={name} 
                disabled={isLoading || formState.isSubmitting}
                className={getFieldClassname(name, {
                        formState, 
                        isValidating,
                        validateOnSubmit, 
                        className
                    })
                } 
                {...register(name, {validate})}
                {...props}
            >
                <option value="">N/A</option>
                {options.map(option => <option key={option.value} value={option.value}>{option.text}</option>)}
            </select>
            {children}
        </div>
        
        {renderInputs()}
    </>
}


export default FormSelect;