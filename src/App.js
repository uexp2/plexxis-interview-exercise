import React from 'react';
import './App.css'

import EmployeeTable from './components/EmployeeTable'
class App extends React.Component {

  render() {
    return (
      <div className="App">
        <h1>Plexxis Employees</h1>
        <EmployeeTable />
      </div>
    );
  }
}

export default App;
