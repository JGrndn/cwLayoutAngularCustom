/* Copyright (c) 2012-2016 Casewise Systems Ltd (UK) - All rights reserved */

/*global cwAPI, jQuery, cwConfigurationEditorMapping */
(function (cwApi, $) {
    "use strict";
  
  var cwLayoutAngularCustom;

  cwLayoutAngularCustom = function (options, viewSchema) {
    cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema);
    this.drawOneMethod = this.drawOne.bind(this);
    cwApi.registerLayoutForJSActions(this);
    this.layoutsByNodeId = {};

    this.displayEngine = null;
  };

  cwLayoutAngularCustom.prototype.applyJavaScript = function () {
    if (!this.canDisplayTemplate){
      return;
    }
    var that = this, templateName = this.options.CustomOptions['template-name'];
    cwApi.CwAsyncLoader.load('angular', function () {
      var loader = cwApi.CwAngularLoader, templatePath, $container = $('#' + that.domId);
      loader.setup();
      that.displayEngine.displayTemplate(loader, templateName, $container);
    });
  };

  cwLayoutAngularCustom.prototype.drawOne = function (output, item, callback) {
    /*jslint unparam:true*/
    return undefined;
  };

  cwLayoutAngularCustom.prototype.drawAssociations = function (output, associationTitleText, object) {
    /*jslint unparam:true*/
    var objectId, associationTargetNode;
    if (cwApi.isUndefinedOrNull(object) || cwApi.isUndefined(object.associations)) {
      // Is a creation page therefore a real object does not exist
      if (!cwApi.isUndefined(this.mmNode.AssociationsTargetObjectTypes[this.nodeID])) {
        objectId = 0;
        associationTargetNode = this.mmNode.AssociationsTargetObjectTypes[this.nodeID];
      } else {
        return;
      }
    } else {
      if (!cwApi.isUndefined(object.associations[this.nodeID])) {
        objectId = object.object_id;
        associationTargetNode = object.associations[this.nodeID];
      } else {
        if (object.iAssociations !== undefined && object.iAssociations[this.nodeID] !== undefined) {
          objectId = object.object_id;
          associationTargetNode = object.iAssociations[this.nodeID];
        } else {
          return;
        }
      }
    }

    var json = {};
    if (this.options.CustomOptions['template-options'] !== '')
    {
      try{
        json = JSON.parse(this.options.CustomOptions['template-options']);
      }
      catch(err){
        cwApi.notificationManager.addError($.i18n.prop('angularCustom_missingOptions'));
        return;
      }
    }
    var templateName = this.options.CustomOptions['template-name'];
    var engine;
    switch (templateName){
      case 'RACI':
        engine = new cwApi.customLibs.cwLayoutAngularCustom.raci(associationTargetNode, json, this);
        break;
      case 'IntersectionActivitiesRoles':
        this.sortDataForIntersectionActivitiesRoles(associationTargetNode);
        break;
      default:
        break;
    }
  
    this.displayEngine = engine;
    this.displayEngine.drawAssociations();

    this.domId = 'cw-layout-' + this.nodeID;
    var visible = true ? 'cw-visible' : '';
    output.push('<div id="', this.domId, '" class="',visible, ' ', this.nodeID, " ", this.nodeID, "-", objectId, ' ', this.LayoutName, ' ', this.mmNode.LayoutDrawOne, " ot-", this.mmNode.ObjectTypeScriptName.toLowerCase(), '">');
    output.push('</div');
    this.canDisplayTemplate = true;
  };

  cwLayoutAngularCustom.prototype.getNextNodeIds = function() {
    var i, lst = [];
    for(i=0; i<this.mmNode.SortedChildren.length; i+=1){
      if (this.mmNode.SortedChildren[i].Type === 1){
        lst.push(this.mmNode.SortedChildren[i].NodeId);
      }
    }
    return lst;
  };

  cwLayoutAngularCustom.prototype.getLayoutContent = function(object, nodeId){
    var output = [], node = this.viewSchema.NodesByID[nodeId], layout;
    layout = new cwApi.cwLayouts[node.LayoutName](node.LayoutOptions, this.viewSchema);
    layout.drawAssociations(output, '', object);
    return output.join('');
  };

  cwLayoutAngularCustom.prototype.sortDataForIntersectionActivitiesRoles = function (associationTargetNode){
    var i, j, child;
    for (i = 0; i < associationTargetNode.length; i += 1) {
      child = associationTargetNode[i];
      this.data.push(child);
      this.htmlData[child.object_id] = {};
      for (j = 0; j < this.metadata.length; j += 1) {
        this.htmlData[child.object_id][this.metadata[j]] = this.getLayoutContent(child, this.metadata[j]);
      }
    }
  }

  cwApi.cwLayouts.cwLayoutAngularCustom = cwLayoutAngularCustom;



}(cwAPI, jQuery));