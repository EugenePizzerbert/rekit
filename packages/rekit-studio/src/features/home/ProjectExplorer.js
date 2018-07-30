import React, { Component } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Spin, Tree } from 'antd';
import { storage } from '../common/utils';
import * as actions from './redux/actions';
import { treeDataSelector } from './selectors/projectData';
import { ProjectExplorerContextMenu } from './';
import plugin from '../plugin/plugin';

const TreeNode = Tree.TreeNode;

export class ProjectExplorer extends Component {
  static propTypes = {
    projectData: PropTypes.object,
    treeData: PropTypes.array,
    actions: PropTypes.object.isRequired,
    elementById: PropTypes.object,
  };

  static defaultProps = {
    projectData: null,
    treeData: null,
    elementById: null,
  };

  constructor(props) {
    super(props);
    this.state.expandedKeys = storage.local.getItem('explorerExpandedKeys', [], true);
  }

  state = {
    selectedKey: null,
    expandedKeys: [],
  };

  eleById = id => this.props.elementById[id];

  handleRightClick = evt => {
    this.ctxMenu.handleRightClick(evt);
  };

  handleSelect = (selected, evt) => {
    const key = evt.node.props.eventKey;
    const hasChildren = !!_.get(evt, 'node.props.children');

    let expandedKeys = this.state.expandedKeys;
    if (hasChildren) {
      if (expandedKeys.includes(key)) {
        expandedKeys = _.without(expandedKeys, key);
      } else {
        expandedKeys = [...expandedKeys, key];
      }
    }
    storage.local.setItem('explorerExpandedKeys', expandedKeys);

    plugin.getPlugins().forEach(p => {
      if (p.projectExplorer && p.projectExplorer.handleSelect) {
        p.projectExplorer.handleSelect(key);
      }
    });

    this.setState({
      selectedKey: key,
      expandedKeys,
    });
  };

  handleExpand = (expanded, evt) => {
    const key = evt.node.props.eventKey;
    let expandedKeys = this.state.expandedKeys;
    if (expandedKeys.includes(key)) {
      expandedKeys = _.without(expandedKeys, key);
    } else {
      expandedKeys = [...expandedKeys, key];
    }

    storage.local.setItem('explorerExpandedKeys', expandedKeys);
    this.setState({
      expandedKeys,
    });
  };

  assignCtxMenu = ctxMenu => (this.ctxMenu = ctxMenu.getWrappedInstance());

  renderTreeNode = nodeData => {
    return (
      <TreeNode key={nodeData.key} title={nodeData.name} className={nodeData.className} isLeaf={!nodeData.children}>
        {nodeData.children && nodeData.children.map(this.renderTreeNode)}
      </TreeNode>
    );
  };

  renderLoading() {
    return (
      <div className="home-project-explorer">
        <Spin />
      </div>
    );
  }

  render() {
    // const { features, srcFiles, featureById, treeData, searchKey } = this.props;
    const prjData = this.props.projectData;

    if (!prjData) {
      return this.renderLoading();
    }

    const treeNodes = this.props.treeData.map(this.renderTreeNode);

    return (
      <div
        className="home-project-explorer"
        ref={node => {
          this.rootNode = node;
        }}
      >
        {treeNodes.length > 0 ? (
          <Tree
            onRightClick={this.handleRightClick}
            autoExpandParent={false}
            selectedKeys={[this.state.selectedKey]}
            expandedKeys={this.state.expandedKeys}
            onSelect={this.handleSelect}
            onExpand={this.handleExpand}
          >
            {treeNodes}
          </Tree>
        ) : (
          <div className="no-results">Project not found.</div>
        )}
        <ProjectExplorerContextMenu ref={this.assignCtxMenu} />
      </div>
    );
  }
}

/* istanbul ignore next */
function mapStateToProps(state) {
  const prjData = state.home.projectData;
  return {
    projectData: prjData,
    elementById: prjData && prjData.elementById,
    treeData: prjData ? treeDataSelector(prjData) : null,
  };
}

/* istanbul ignore next */
function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({ ...actions }, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectExplorer);
