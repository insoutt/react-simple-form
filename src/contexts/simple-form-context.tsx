import { createContext } from 'react';
import type {
  FormClassNames,
  Preprocessor,
  Validator,
} from '../utils/index.js';

interface SimpleFormContextInterface {
  isLoading: boolean;
  validateOnSubmit: boolean;
  validator?: Validator;
  classNames?: FormClassNames;
  preprocessors?: Record<string, Preprocessor>;
  resetCount: number;
}

export const SimpleFormContext = createContext<SimpleFormContextInterface>({
  isLoading: false,
  validateOnSubmit: false,
  resetCount: 0,
});
