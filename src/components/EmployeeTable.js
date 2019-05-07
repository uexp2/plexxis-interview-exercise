import React from 'react';

import ReactTable from  'react-table';
import './EmployeeTable.css'

const apiUrl = process.env.REACT_APP_API_URL;

// ~~~ Start employee table
export default class EmployeeTable extends React.Component {
  constructor (props) {
    super(props);
    this._defaultNewDataFields = {
      id: '',
      name: '',
      code: '',
      profession: '',
      color: '',
      city: '',
      branch: '',
      assigned: null
    };
    this.state = {
      employees: [],
      deletionSelection: {},
      newDataFields: this._defaultNewDataFields,
      rowsInEditMode: {}
    };

    this.dirtyEmployees = []  // for use of edits

    this.editedFields = {}

    this.onClickDeleteSelection = this.onClickDeleteSelection.bind(this);
    this.onClickAddEmployee = this.onClickAddEmployee.bind(this);
    this.getEmployees = this.getEmployees.bind(this);
    this.onSaveEdits = this.onSaveEdits.bind(this);
  }

  _deepArrayCopy(arrayOfObjects) {
    return arrayOfObjects.map(obj => {return {...obj}})
  }

  componentWillMount = () => {
    this.getEmployees();
  }

  getEmployees(offset = 0, limit = 20) {
    fetch(apiUrl + '/api/employees')
      .then(response => {
        return response.json();
      })
      .then(employees => this.setState(() => { 
        this.dirtyEmployees = this._deepArrayCopy(employees);
        return {employees: employees};
      }))
  }

  onClickDeleteSelection(){
    const { employees, deletionSelection} = this.state;
    const delSelKeys = Object.keys(deletionSelection);
    if (!delSelKeys.length) return; // Do nothing. Obj empty
    const selectedIds = delSelKeys.filter(id => deletionSelection[id])
    if (!selectedIds.length) return; // No employees selected
    const reqBody = {
      arrayIds: selectedIds,
    }
    fetch(apiUrl+ '/api/employees', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reqBody)
    })
    .then(response => {
      if (response.ok) {
        this.setState({ 
          employees: employees.filter(({id}) => !deletionSelection[id]),
          deletionSelection: {}
        })
      } else {
        let alertMessage = 'Deletion error, deletion not completed. Code: '.concat(response.status.toString())
        alert(alertMessage)
      }
    })
    .catch((err) => {
      console.log(err)
      alert('Connection error. Deletion was not completed.')
    })
  }

  addEmployees(arrayEmployees, onResponse, onError) {
    if (arrayEmployees.length === 0) return;  // no employees
    fetch(apiUrl + '/api/employees', {
      method:'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(arrayEmployees)
    })
    .then(onResponse)
    .catch(onError)
  }

  editEmployees(arrayEmployees, onResponse, onError) {
    if (arrayEmployees.length === 0) return;  // no employees
    fetch(apiUrl + '/api/employees', {
      method:'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(arrayEmployees)
    })
    .then(onResponse)
    .catch(onError)
  }

  onClickAddEmployee() {
    const { newDataFields } = this.state;
    // Create new employee.
    if (!newDataFields.name || newDataFields.name === '') {
      // do nothing, at least name field required.
      alert('Addition failed. At minimum employee name must be provided.');
      return;
    }
    const onResponse = (response) => {
      this.getEmployees();
      if (response.ok) {
        if (response.status === 202) {
          alert('One or more employees not added')
        }
        this.setState({newDataFields: this._defaultNewDataFields});
      } else {
        alert('Error. No employees added.');
      }
    }
    const onError = () => {
      alert('Connection error. Employee(s) not added.')
    }
    this.addEmployees([newDataFields], onResponse, onError);
  }

  onSaveEdits() {
    const { rowsInEditMode, employees } = this.state;
    const dirtyEmployees = this.dirtyEmployees;
    let arrayIndexesInEditMode = Object.keys(rowsInEditMode).filter(key => {
      return rowsInEditMode[key];
    })
    if (arrayIndexesInEditMode.length === 0) {
      alert('No changes found.')
    }

    // Generate array of employees containing,
    // only fields that have changed
    let diffFields;
    const reqBody = arrayIndexesInEditMode.map(index => {
      diffFields={id:dirtyEmployees[index].id};
      Object.keys(dirtyEmployees[index]).forEach(key => {
        if (dirtyEmployees[index][key] !== employees[index][key]) {
          diffFields[key] = dirtyEmployees[index][key]; 
        }
      })
      return diffFields;
    })


    const onResponse = response => {
      if (response.ok) {
        let unedited = {};
        if (response.status === 202) {
          // Generate a 'set' of ids that have not been
          // edited on the server
          let employeesUnedited = response.json();
          employeesUnedited.forEach(({id}) => {
            unedited[id] = {};  // placeholder
          })
        }

        // For each employee that have been sucessfully added,
        // update ONLY those employees in the table
        const [...employees] = this.state.employees;
        employees.forEach((employee, i) => {
          if (employee.id in unedited) return; //continue
          employees[i] = {...this.dirtyEmployees[i]}
        })

        // For each unedited employee, maintain active edit fields
        let maintainEditMode = {};
        Object.keys(unedited).forEach(id => {
          let row = this.dirtyEmployees.findIndex(({idEm}) => idEm === id);
          maintainEditMode[row] = true;
        })

        this.dirtyEmployees = employees;
        this.setState({employees:employees, rowsInEditMode: maintainEditMode})
        //this.getEmployees();
      } else {
        alert('Error. No employee(s) edited.');
      }
    }

    const onError = () => {
      alert('Connection error. Employee(s) not edited.');
    }

    this.editEmployees(reqBody, onResponse, onError);
  }

  render() {
    const { employees, deletionSelection } = this.state;

    const deleteCheckbox = ({ original }) => {
      return (
        <input 
          type="checkbox" 
          checked={deletionSelection[original.id] === true}
          onChange={() => {  // toggle
            deletionSelection[original.id] = 
              !(deletionSelection[original.id] === true);
            this.setState({deletionSelection: deletionSelection});
          }}
        />
        );
    }

    const footerTextInputConstructor = (className, stateAccessor, placeholder) => {
      const {newDataFields} = this.state;
      let classNameString = 'footer '.concat(className);
      return (<input 
        className={classNameString} 
        type="text" 
        value={newDataFields[stateAccessor] ? newDataFields[stateAccessor] : ''}
        onChange={(e) => {
          let hold = e.target.value === '' ? null : e.target.value;
          this.setState(state => {
            const {...copy} = state.newDataFields;
            copy[stateAccessor] = hold;
            return {newDataFields:copy};
          })
        }} 
        placeholder={placeholder}
      />);
    }

    // Dropdown menu to select assigned state
    // FOR employee ADDITION
    const footerAssignedDropdown = (className, stateAccessor) => {
      const {newDataFields} = this.state;
      let classNameString = 'footer '.concat(className);
      const onChange = e => {
        let hold = e.target.value;
        if (hold === '') {
          hold = null;
        } else {
          hold = (hold === 'true')
        }
        this.setState(state => {
          const {...copy} = state.newDataFields;
          copy[stateAccessor] = hold;
          return {newDataFields:copy};
        })
      }
      return (
        <select 
          className={classNameString}
          value={newDataFields[stateAccessor] === null ? '' : newDataFields[stateAccessor]} 
          onChange={onChange}
          >
          <option value=''> N/A </option>
          <option value='true'> True </option>
          <option value='false'> False </option>
        </select>
      );
    }

    // Special Toggle mode for 'Assigned' column;
    const cellToggleEditModeAssigned = ({index}) => {
      const onChange = (e) => {
        let hold = e.target.value;
        if (hold === '') {
          hold = null;
        } else {
          hold = (hold === 'true')
        }
        this.dirtyEmployees[index]['assigned'] = hold;
        console.log(this.dirtyEmployees[index]['assigned'])
        this.forceUpdate();
      }
      let value = this.dirtyEmployees[index]['assigned'];
      if (this.state.rowsInEditMode[index]) {
        return (
          <select value={value === null ? '' : value.toString()} onChange={onChange}>
            <option value=''> N/A </option>
            <option value='true'> True </option>
            <option value='false'> False </option>
          </select>
        );
      } else {
        let dispVal;
        if (value === null) {
          dispVal = 'N/A'
        } else if (value) {
          dispVal = 'True'
        } else {
          dispVal = 'False'
        }
        return dispVal;
      }
    }

    const toggleEditUndo = ({index}) => {
      return (
        <button type='button'
          onClick={() => { 
            const { ...rowsInEditMode } = this.state.rowsInEditMode;
            if (!(index in rowsInEditMode)) {
              rowsInEditMode[index] = false;
            }
            // reset row
            if (rowsInEditMode[index]) this.dirtyEmployees[index] = {...this.state.employees[index]};
            //toggle
            rowsInEditMode[index] = !rowsInEditMode[index];
            this.setState({rowsInEditMode:rowsInEditMode}) 
          }
        }> 
          {this.state.rowsInEditMode[index] ? 'Undo Row' : 'Edit'} 
        </button>)
    }
    
    const editTableTextField = (column) => {
      return (props) => {
        return (<div
          style={{
            background:  this.state.rowsInEditMode[props.index] ? 'white' : '',
            border:  this.state.rowsInEditMode[props.index] ? '1px solid black' : 'none',
            minWidth: '50px'
          }}
          contentEditable={this.state.rowsInEditMode[props.index]}
          suppressContentEditableWarning
          onBlur={e => {
            if (column === 'name' && e.target.innerHTML === '') {
              alert('New employee name cannot be empty');
              e.target.innerHTML = this.dirtyEmployees[props.index][column];
            }
            this.dirtyEmployees[props.index][column] = e.target.innerHTML;
          }}
          dangerouslySetInnerHTML={{
            __html: this.dirtyEmployees[props.index][column] ? this.dirtyEmployees[props.index][column] : ''
          }}
        />)
      }
    }

    const columns = [
      {Header: 'ID', accessor: 'id'},
      {Header: 'Name', accessor: 'name',  Cell: editTableTextField('name'),
        Footer: footerTextInputConstructor('name', 'name', 'Name')},
      {Header: 'Code', accessor: 'code',   Cell: editTableTextField('code'),
        Footer: footerTextInputConstructor('code', 'code', 'Code')},
      {Header: 'Profession', accessor: 'profession', Cell: editTableTextField('profession'),
        Footer: footerTextInputConstructor('profession', 'profession', 'Profession')},
      {Header: 'Color', accessor: 'color',   Cell: editTableTextField('color'),
        Footer: footerTextInputConstructor('color', 'color', 'Color')},
      {Header: 'City', accessor: 'city',   Cell: editTableTextField('city'),
        Footer: footerTextInputConstructor('city', 'city', 'City')},
      {Header: 'Branch', accessor: 'branch',   Cell: editTableTextField('branch'),
        Footer: footerTextInputConstructor('branch', 'branch', 'Branch')},
      {Header: 'Assigned', accessor: 'assigned', Cell: cellToggleEditModeAssigned, 
        Footer: footerAssignedDropdown('assigned', 'assigned')},
      {Header: (<button onClick={this.onClickDeleteSelection}> Delete Selected </button>), Cell: deleteCheckbox, sortable:false,
        Footer: (<button onClick={this.onClickAddEmployee}> Add Employee </button>)},
      {Header: (<button onClick={this.onSaveEdits}> Save Edits </button>), Cell:toggleEditUndo, sortable:false}
    ];

    const getTdProps = (state, rowInfo, column, instance) => {
      if (!rowInfo) return {};
      const style = {};
      Object.assign(style, { background: rowInfo.original.color });
      return { style:style };
    }

    return (
      <div className="rt-wrapper">
        <ReactTable 
          data={employees} 
          columns={columns} 
          minRows={10}
          getTdProps={getTdProps}
          loadingText=''
          />
      </div>
    );
  }
}