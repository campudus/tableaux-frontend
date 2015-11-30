var React = require('react');

var TableTools = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    tableName : React.PropTypes.string.isRequired
  },

  render : function () {
    return (
      <div id="table-tools">
        <div id="table-switcher" className="active">
          <a href="#" id="current-table">
            <i className="fa fa-columns"></i>
            <span>{this.props.tableName}</span>
            <i className="fa fa-angle-down"></i>
          </a>
          <div id="table-list-wrapper">

            <div className="search-input-wrapper">
              <input type="text" className="search-input" placeholder="Search Table..."
                /*onChange={this.onSearch}
                 defaultValue={this.state.search} ref="search"*/
              />
              <i className="fa fa-search"></i>
            </div>

            <div id="table-list">
              <ul>
                <li>Lorem</li>
                <li>Ipsum</li>
                <li>Test</li>
                <li>Test2</li>
                <li>Test3</li>
                <li>Lorem</li>
                <li>Ipsum</li>
                <li>Test</li>
                <li>Test2</li>
                <li>Test3</li>
                <li>Lorem</li>
                <li>Ipsum</li>
                <li>Test</li>
                <li>Test2</li>
                <li>Test3 kdjfakdjf adkjf akdjfka dfjkad fajdkf adjfka dfkadj fkjadfk adfkja dfkjad kfjadkfj d Ganz
                  langes wort wo ist das ?
                </li>
                <li>Lorem</li>
                <li>Ipsum</li>
                <li>Test</li>
                <li>Test2</li>
                <li>Test3</li>
                <li>Lorem</li>
                <li>Ipsum</li>
                <li>Test</li>
                <li>Test2</li>
                <li>Test3</li>
                <li>Lorem</li>
                <li>Ipsum</li>
                <li>Test</li>
                <li>Test2</li>
                <li>Test3</li>
                <li>Lorem</li>
                <li>Ipsum</li>
                <li>Test</li>
                <li>Test2</li>
                <li>Test3</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    )
  }
});

module.exports = TableTools;