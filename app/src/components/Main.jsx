import { ipcRenderer } from 'electron';
import React, { Component } from 'react';
import DropZone from './DropZone.jsx';
import ModalPrompt from './ModalPrompt.jsx';
import Chart from './Chart.jsx';

import {
  retrieveWebpackStats,
  retrieveRollupStats,
  retrieveParcelStats,
} from '../redux/actions/dataActions';

import { connect } from 'react-redux';
import { isLoading, showModal } from '../redux/actions/homeActions';
import * as home from '../redux/constants/homeConstants';

import Bee from './loaders/awesomeBee.jsx';
import ImportLoader from './loaders/ImportLoader.jsx';
import CodeLoader from './loaders/CodeLoader.jsx';

import ReactTooltip from 'react-tooltip';
export class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mainPageMessage: '',
      dirname: '',
    };
    this.handleRestart = this.handleRestart.bind(this);
  }
  componentDidMount() {
    ipcRenderer.on('handle-file-indexing-results', (event, res) => {
      if (res.foundWebpackConfig) {
        this.props.showModal();
      } else if (res.foundEntryFile) {
        ipcRenderer.send('run-webpack', { createNewConfig: true });
      } else {
        console.log('no index.js nor webpack.config found');
        this.setState({ mainPageInstructions: 'Please drop your entry file as well' });
      }
    });

    ipcRenderer.on('webpack-stats-results-json', (event, res) => {
      ipcRenderer.send('run-parcel');
      console.log('@webpack');
      this.props.retrieveWebpackStats(res);
    });

    ipcRenderer.on('parcel-stats-results-json', (event, res) => {
      ipcRenderer.send('run-rollup');
      console.log('@parcel');

      this.props.retrieveParcelStats(res);
    });
    ipcRenderer.on('rollup-stats-results-json', (event, res) => {
      console.log('build finished');
      this.setState({ dirname: res });
      this.props.retrieveRollupStats();
    });
    ipcRenderer.on('error', () => {
      this.setState({ mainPageMessage: 'An issue occurred while bundling your project.' });
    });

    // ipcRenderer.on('rollup-stats-results-json', event => {
    //   ipcRenderer.send('run-parcel');
    //   this.props.retrieveRollupStats();
    // });
  }
  renderLoadingModal() {
    return <ImportLoader />;
  }

  renderLoadingBundle() {
    return <CodeLoader />;
  }

  dropZoneActive() {
    return (
      <DropZone>
        <div className="drag_div">
          <img className="cloud_upload" src="./assets/cloud_upload.png" />
          <h2>{this.state.mainPageInstructions}</h2>
        </div>
      </DropZone>
    );
  }

  renderModal() {
    return <ModalPrompt />;
  }
  renderChart() {
    return <Chart dirname={this.state.dirname} />;
  }
  handleRestart() {
    ipcRenderer.send('restart');
  }
  render() {
    // // THIS IS FOR DEBUGGING PURPOSES
    // console.log(this.props.home.screen, home.SHOW_STARBURST, "MAIN JSX")
    // if ( this.props.home.screen !== home.SHOW_STARBURST) {
    //   console.log("at if statement")
    //   this.props.retrieveWebpackStats();
    //   // this.props.retrieveParcelStats();
    // //   // this.props.retrieveRollupStats();

    // }

    let mainPage = null;
    if (this.props.home.screen === home.DIRECTORY_PENDING) mainPage = this.dropZoneActive();
    else if (this.props.home.screen === home.LOADING_MODAL) mainPage = this.renderLoadingModal();
    else if (this.props.home.screen === home.SHOW_MODAL) mainPage = this.renderModal();
    else if (this.props.home.screen === home.LOADING_BUNDLE) mainPage = this.renderLoadingBundle();
    else if (this.props.home.screen === home.SHOW_STARBURST) mainPage = this.renderChart();

    return (
      <div className="main">
        <div className="header">
          <Bee />
        </div>
        {this.state.mainPageMessage && (
          <div>
            <h1>{this.state.mainPageMessage}</h1>
            <button onClick={() => this.handleRestart()}>Restart</button>
          </div>
        )}
        <div>{mainPage}</div>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  showModal: () => dispatch(showModal()),
  retrieveWebpackStats: bundleDir => dispatch(retrieveWebpackStats(bundleDir)),
  retrieveParcelStats: bundleDir => dispatch(retrieveParcelStats(bundleDir)),
  retrieveRollupStats: bundleDir => dispatch(retrieveRollupStats(bundleDir)),
});

const mapStateToProps = state => ({ home: state.home });

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Main);
