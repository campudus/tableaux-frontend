var React = require('react');
var FileChangeUpload = require('./FileChangeUpload.jsx');
var LanguageSwitcher = require('../../header/LanguageSwitcher.jsx');

var MultifileFileEdit = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    originalLangtag : React.PropTypes.string.isRequired,
    fileData : React.PropTypes.object.isRequired,
    onChange : React.PropTypes.func.isRequired
  },

  componentWillMount : function () {
    this.titleId = "fileTitle_" + this.props.langtag;
    this.descId = "fileDescription_" + this.props.langtag;
    this.externalNameId = "fileLinkName" + this.props.langtag;
  },

  shouldComponentUpdate : function (nextProps) {
    return nextProps.fileData.title !== this.props.fileData.title ||
      nextProps.fileData.description !== this.props.fileData.description ||
      nextProps.fileData.externalName !== this.props.fileData.externalName ||
      nextProps.fileData.internalName !== this.props.fileData.internalName ||
      nextProps.langtag !== this.props.langtag;
  },

  onChange : function (event, key) {
    var changedVal = event.target.value;
    this.props.onChange(this.props.originalLangtag, key, changedVal);
  },

  onTitleChange : function (event) {
    this.onChange(event, 'title');
  },

  onDescriptionChange : function (event) {
    this.onChange(event, 'description');
  },

  onExternalNameChange : function (event) {
    this.onChange(event, 'externalName');
  },

  onLangChange : function (lang) {
    this.props.onChange(this.props.originalLangtag, 'language', lang);
  },

  render : function () {
    return (
      <div className="multifile-file-edit">
        <div className="input-wrapper">
          <div className="cover-wrapper">
            <div className="cover">
              <FileChangeUpload
                langtag={this.props.langtag}
                internalFileName={this.props.fileData.internalName}
                uuid={this.props.fileData.uuid}/>
            </div>
          </div>
          <div className="properties-wrapper">
            <div className='field-item'>
              <label htmlFor={this.titleId} className="field-label">Titel</label>
              <div className="field-input">
                <input type="text" className="field-text-input" id={this.titleId} value={this.props.fileData.title}
                       onChange={this.onTitleChange}/>
              </div>
            </div>
            <div className='field-item'>
              <label htmlFor={this.descId} className="field-label">Beschreibung</label>
              <div className="field-input">
                <input type="text" className="field-text-input" id={this.descId}
                       value={this.props.fileData.description}
                       onChange={this.onDescriptionChange}/>
              </div>
            </div>
            <div className='field-item'>
              <label htmlFor={this.externalNameId} className="field-label">Linkname</label>
              <div className="field-input">
                <input type="text" className="field-text-input" id={this.externalNameId}
                       value={this.props.fileData.externalName}
                       onChange={this.onExternalNameChange}/>
              </div>
            </div>
            <LanguageSwitcher
                    langtag={this.props.langtag}
                    onChange={this.onLangChange}
            />
          </div>
        </div>
      </div>
    );
  }
});

module.exports = MultifileFileEdit;