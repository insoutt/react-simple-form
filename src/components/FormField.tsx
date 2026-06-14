import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import { FieldValues, useFormContext } from "react-hook-form"
import { useContext, useEffect } from "react";
import { cn } from "../utils/utils";
import { FieldProps } from "../utils/types";
import { SimpleFormContext } from "../contexts/simple-form-context";

const FormField = <T extends FieldValues>(props: FieldProps<T>): JSX.Element => {

    const { unregister, formState: {errors} } = useFormContext();
    const {classNames} = useContext(SimpleFormContext);


    useEffect(() => {
        return () => {
            unregister(props.name);
        }
    }, [unregister, props.name]);

    const renderField = () => {
        switch (props.type) {
            case 'select':
                return (
                    <FormSelect<T>
                        {...props}
                        options={props.options}
                        validation={props.validation}
                        className={cn(classNames?.input || classNames?.field)}
                        groupClassName={cn(classNames?.group)}
                        labelClassName={cn(classNames?.label)}
                        renderFields={(fieldProps) => <FormField<T> key={fieldProps.name} {...fieldProps}/>}
                    >
                        {renderChild()}
                    </FormSelect>
                );
            default:
                return (
                    <FormInput<T>
                        {...props}
                        validation={props.validation}
                        className={cn(classNames?.input || classNames?.field)}
                        groupClassName={cn(classNames?.group)}
                        labelClassName={cn(classNames?.label)}
                    >
                        {renderChild()}
                    </FormInput>
                );
        }
    }

    const getErrorMessage = (): string | null => {
        const message = errors[props.name]?.message;
        return (typeof message === 'string') ? message : null;
    }

    const renderChild = () => {
        return (<>
            {getErrorMessage() !== null && <p role="alert" className="form-error">{getErrorMessage()}</p>}
            {props.helpText && <span className="form-help-text">{props.helpText}</span>}
        </>);
    }

    return (<>
        {renderField()}
    </>)
};

export default FormField;