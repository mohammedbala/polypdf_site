import React from 'react';
import { BrowserRouter } from 'react-router';
import AppRoutes from './AppRoutes';

const App = ({toolkitStrings}) => {
  return (
    <BrowserRouter>
      <AppRoutes toolkitStrings={toolkitStrings}/>
    </BrowserRouter>
  );
};

export default App;
