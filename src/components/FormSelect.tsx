import { useFormContext, FieldValues } from "react-hook-form"
import { cn, parseValidation } from '../utils/utils';
import { SelectProps } from "../utils/types";
import { useContext } from "react";
import { SimpleFormContext } from "../contexts/simple-form-context";

const FormSelect = <T extends FieldValues>({ label, name, options, validation, props, labelClassName, groupClassName, className, renderFields }: SelectProps<T>): JSX.Element => {
    const { register, watch } = useFormContext();
    const {isLoading, validator} = useContext(SimpleFormContext);
    const selectedValue = watch(name);
    const validate = parseValidation(validation, validator);


    const renderInputs = () => {
        const option = options.find(item => item.value === selectedValue);

        if(!option?.fields || typeof renderFields !== 'function') return;

        return option.fields.map(field => renderFields(field));
    }

    return <>
        <div className={cn(groupClassName || 'form-group')}>
            <label className={labelClassName || 'form-label'} htmlFor={name}>{label}</label>
            <select id={name} 
                disabled={isLoading} 
                className={cn(className || 'form-control')} 
                {...register(name, {required: {
                    value: true,
                    message: 'Obligatorio'
                }, validate})} 
                {...props}
            >
                <option value="">N/A</option>
                {options.map(option => <option key={option.value} value={option.value}>{option.text}</option>)}
            </select>
        </div>
        
        {renderInputs()}
    </>
}


export default FormSelect;