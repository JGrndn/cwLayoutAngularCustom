/* Copyright (c) 2012-2016 Casewise Systems Ltd (UK) - All rights reserved */

/*global cwAPI, jQuery, cwConfigurationEditorMapping */
(function (cwApi, $) {
  "use strict";

  var engine = function (associationTargetNode, options, layout) {
    this.layout = layout;
    this.options = options;
    this.data = associationTargetNode;
  };

  engine.prototype.getTemplatePath = function (templateName) {
    return cwApi.format('{0}/html/{1}/{2}.ng.html', cwApi.getCommonContentPath(), 'cwLayoutAngularCustom', templateName);
  };


  engine.prototype.executeTemplate = function($scope){
  };

  engine.prototype.drawAssociations = function(){
  };

  engine.prototype.displayTemplate = function(loader, templateName, $container){
    var that = this, templatePath = this.getTemplatePath(templateName);

    loader.loadControllerWithTemplate('cwLayoutAngularCustom', $container, templatePath, function ($scope) {
      $scope.getNodeName = function (nodeId) {
        return that.layout.viewSchema.NodesByID[nodeId].NodeName;
      };

      $scope.getItemDisplayString = function (item) {
        var layoutOptions, getDisplayStringFromLayout = function (l) {
          return l.getDisplayItem(item);
        };
        if (item.nodeID === that.layout.nodeID) {
          return that.layout.getDisplayItem(item);
        }
        if (!that.layout.layoutsByNodeId.hasOwnProperty(item.nodeID)) {
          if (that.layout.viewSchema.NodesByID.hasOwnProperty(item.nodeID)) {
            layoutOptions = that.layout.viewSchema.NodesByID[item.nodeID].LayoutOptions;
            that.layout.layoutsByNodeId[item.nodeID] = new cwApi.cwLayouts[item.layoutName](layoutOptions, that.layout.viewSchema);
          } else {
            return item.name;
          }
        }
        return getDisplayStringFromLayout(that.layout.layoutsByNodeId[item.nodeID]);
      };
      that.executeTemplate($scope);

      /*$scope.getMaxRowspan = function (lst) {
        if (cwApi.isUndefined(lst)) {
          return 1;
        }
        return Math.max(lst.length, 1);
      }; */

      /* $scope.data = that.data;
      $scope.metadata = that.metadata;
      $scope.htmlData = that.htmlData; */
    });
  };

  if (!cwApi.customLibs) {
    cwApi.customLibs = {};
  }
  if (!cwApi.customLibs.cwLayoutAngularCustom) {
    cwApi.customLibs.cwLayoutAngularCustom = {};
    cwApi.customLibs.cwLayoutAngularCustom.displayEngine = engine;
  }


}(cwAPI, jQuery));