import { createContext } from 'react';
import { FormClassNames, Preprocessor, Validator } from '../utils';

interface SimpleFormContextInterface {
  isLoading: boolean;
  validateOnSubmit: boolean;
  validator?: Validator;
  classNames?: FormClassNames;
  preprocessors?: Record<string, Preprocessor>;
}

export const SimpleFormContext = createContext<SimpleFormContextInterface>({
  isLoading: false,
  validateOnSubmit: false,
});
