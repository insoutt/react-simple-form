import { useForm, useWatch, get, SubmitHandler, FormProvider, FieldValues } from "react-hook-form"
import FormField from "./FormField";
import { FormProps } from '../utils/types';
import { cn } from '../utils/utils';
import { SimpleFormContext } from "../contexts/simple-form-context";

const Form = <T extends FieldValues>({fields, validator, beforeSubmit, afterSubmit, className, classNames, isLoading, onSubmit, onClear, loadingText, hideClearButton, validateOnSubmit, children, defaultValues, preprocessors, submitText = 'Submit', clearText = 'Clear'}: FormProps<T>) => {
    loadingText = loadingText || submitText;

    const methods = useForm<T>({
        defaultValues,
    });

    const {isSubmitting} = methods.formState;
    // Compare registered values only, a field without default counts as clean while empty
    const values = useWatch({ control: methods.control });
    const isDirty = Object.keys(values).some(name => {
        const defaultValue = get(methods.formState.defaultValues, name);
        const value = values[name];
        return typeof defaultValue === 'undefined'
            ? !(value === undefined || value === null || value === false || value.length === 0)
            : value !== defaultValue;
    });
    const isFormBusy = isLoading || isSubmitting;

    const formSubmit: SubmitHandler<T> = async (values: T) => {
        if(typeof beforeSubmit === 'function') {
            try {
                const before = await beforeSubmit(values);
                if(before === false) {
                    return;
                } else if(before !== true) {
                    values = before;
                }
            } catch (error) {
                console.warn('beforeSubmit failed, onSubmit skipped:', error);
                return;
            }
        }

        if(validateOnSubmit) {
            // Call validation when validateOnSubmit is true
            const isValid = await methods.trigger();

            if (!isValid) {
                return;
            }
        }

        try {
            await onSubmit?.(values);
            await afterSubmit?.(values);
        } catch (error) {
            console.warn('onSubmit failed, afterSubmit skipped:', error);
        }

    };

    const clear = () => {
        methods.reset();
        onClear?.();
    }

    return (
        <SimpleFormContext.Provider value={{
            isLoading: !!isFormBusy,
            validateOnSubmit: !!validateOnSubmit,
            validator,
            classNames,
            preprocessors,
        }}>
            <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(formSubmit)} className={className}>
                {fields.map(field => (
                    <FormField<T> key={field.name} {...field}/>
                ))}

                {typeof children === 'function'
                    ? children(methods.handleSubmit(formSubmit), clear)
                    : typeof children !=='undefined' ? children : <div className="form-action-buttons">
                            <button className={cn(classNames?.submitButton || 'btn btn-primary')} type="submit" disabled={isFormBusy}>
                                {isFormBusy ? loadingText : submitText}
                            </button>
                            {!hideClearButton && !isFormBusy && isDirty && <>
                                <button type="button" className={cn(classNames?.clearButton)} onClick={clear}>
                                    {clearText}
                                </button>
                            </>}
                        </div>}
            </form>
        </FormProvider>
        </SimpleFormContext.Provider>
    )
}

export default Form;