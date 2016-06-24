var React = require('react');
var _ = require('lodash');
var LinkOverlay = require('./LinkOverlay.jsx');
var LinkLabelCell = require('./LinkLabelCell.jsx');
var OverlayHeadRowIdentificator = require('../../overlay/OverlayHeadRowIdentificator.jsx');
var ActionCreator = require('../../../actions/ActionCreator');

export default class CurrencyEditCell extends React.Component {

  static propTypes = {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    editing : React.PropTypes.bool.isRequired,
    setCellKeyboardShortcuts : React.PropTypes.func
  };

  componentDidMount() {
    this.props.setCellKeyboardShortcuts({
      enter : (event) => {
        //stop handling the Table events
        event.stopPropagation();
        event.preventDefault();
      }
    });
  }

  componentWillUnmount() {
    console.log("CurrencyCell will unmount, save changes");

    //Important to clean up the keyboard shortcuts
    this.props.setCellKeyboardShortcuts({});
  }


  render() {
    var self = this;
    var links = self.props.cell.value.map(function (element, index) {


      return <LinkLabelCell key={element.id} deletable={true} linkElement={element}
                            cell={self.props.cell} langtag={self.props.langtag} onDelete={self.removeLink}
                            linkIndexAt={index}/>;
    });

    links.push(<button key={"add-btn"} className="add" onClick={self.openOverlay}>+</button>);

    return (
      <div className={'cell-content'}>
        {links}
      </div>
    );
  }

}
