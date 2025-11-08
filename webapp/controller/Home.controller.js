sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/Token"
], (Controller, JSONModel, Filter, FilterOperator, MessageToast, Token) => {
    "use strict";
    var that;
    return Controller.extend("vcpapp.lags.controller.Home", {
        onInit() {
            that = this;
            that.oGModel = that.getOwnerComponent().getModel("oGModel");
            that.catModel = that.getOwnerComponent().getModel("catalog");
            that.planModel = that.getOwnerComponent().getModel("planner");
            that.loadFragments();
            that.oGModel.setProperty("/showPivot", false);
            that.oGModel.setProperty("/tableType", 'Table');
            that.staticColumns = ["Assembly", "Lag Month"]
        },
        onAfterRendering: async function () {
            that.mulInpFLoc = that.byId("idFacLocLag");
            that.mulInpLoc = that.byId("idLocLag");
            that.mulInpPro = that.byId("idProdLag");
            // that.mulInpAsm = that.byId("idAsmbLag");
            that.mulInpmStart = that.byId("idMonStartLag");
            that.mulInpmEnd = that.byId("idMonEndLag");
        },
        loadFragments: function () {
            // that.oCheckBox = new sap.m.CheckBox({
            //     select: (params) => {
            //         that.handleCheckboxChange(params);
            //     }
            // });

            that.oHBox = new sap.m.HBox({
                alignItems: "Center",
                items: [
                    // that.oCheckBox,
                    new sap.m.Title({
                        text: "Select All",
                        titleStyle: "Auto"
                    })
                ]
            });
            if (!that._valueHelpDialogFLoc) {
                that._valueHelpDialogFLoc = sap.ui.xmlfragment("vcpapp.lags.fragments.FLocation", that);
                that.getView().addDependent(that._valueHelpDialogFLoc);
                that.oHBox.getItems()[0].setText("Factory Locations");
                that._valueHelpDialogFLoc._oDialog.insertContent(that.oHBox.clone(), 1);
            }
            if (!that._valueHelpDialogLoc) {
                that._valueHelpDialogLoc = sap.ui.xmlfragment("vcpapp.lags.fragments.Location", that);
                that.getView().addDependent(that._valueHelpDialogLoc);
                that.oHBox.getItems()[0].setText("Demand Locations");
                that._valueHelpDialogLoc._oDialog.insertContent(that.oHBox.clone(), 1);
            }
            if (!that._valueHelpDialogProd) {
                that._valueHelpDialogProd = sap.ui.xmlfragment("vcpapp.lags.fragments.Product", that);
                that.getView().addDependent(that._valueHelpDialogProd);
                that.oHBox.getItems()[0].setText("Products");
                that._valueHelpDialogProd._oDialog.insertContent(that.oHBox.clone(), 1);
            }
            if (!that._valueHelpDialogAsmb) {
                that._valueHelpDialogAsmb = sap.ui.xmlfragment("vcpapp.lags.fragments.Assembly", that);
                that.getView().addDependent(that._valueHelpDialogAsmb);
                that.oHBox.getItems()[0].setText("Assembly");
                that._valueHelpDialogAsmb._oDialog.insertContent(that.oHBox.clone(), 1);
            }
            if (!that._valueHelpDialogMStart) {
                that._valueHelpDialogMStart = sap.ui.xmlfragment("vcpapp.lags.fragments.MStart", that);
                that.getView().addDependent(that._valueHelpDialogMStart);
                that.oHBox.getItems()[0].setText("Month Start");
                that._valueHelpDialogMStart._oDialog.insertContent(that.oHBox.clone(), 1);
            }

            if (!that._valueHelpDialogMEnd) {
                that._valueHelpDialogMEnd = sap.ui.xmlfragment("vcpapp.lags.fragments.MEnd", that);
                that.getView().addDependent(that._valueHelpDialogMEnd);
                that.oHBox.getItems()[0].setText("Month End");
                that._valueHelpDialogMEnd._oDialog.insertContent(that.oHBox.clone(), 1);
            }

            if (!that.AsmbTable) {
                that.AsmbTable = sap.ui.xmlfragment("vcpapp.lags.fragments.AsmbTable", that);
                that.getView().addDependent(that.AsmbTable);
            }

        },
        onClear() {
            that.totalFilterData = undefined;
            that.oGModel.setProperty("/showPivot", false);
            that.oGModel.setProperty("/tableType", 'Table');
            that.mulInpFLoc.removeAllTokens();
            that.mulInpLoc.removeAllTokens();
            that.mulInpPro.removeAllTokens();
            that.mulInpmStart.removeAllTokens();
            that.mulInpmEnd.removeAllTokens();
            that._valueHelpDialogFLoc.setModel(new JSONModel([]));
            that._valueHelpDialogLoc.setModel(new JSONModel([]));
            that._valueHelpDialogProd.setModel(new JSONModel([]));
            that._valueHelpDialogMStart.setModel(new JSONModel([]));
            that._valueHelpDialogMEnd.setModel(new JSONModel([]));
            sap.ui.getCore().byId("asmDetailsDialog").setModel(new JSONModel([]));
            that.allData = [];
            var existingDiv = document.querySelector('[id*="mainDivLag"]');
            if (existingDiv.children.length > 0) {
                while (existingDiv.firstChild) {
                    existingDiv.removeChild(existingDiv.firstChild);
                }
            }
        },
        handleCheckboxChange: function (event) {
            var controlId = event.getSource().getParent().getParent().sId.split("-")[0];
            if (event.getParameters().selected) {
                let items = sap.ui.getCore().byId(`${controlId}`).getItems();
                items.forEach(i => {
                    i.setSelected(true);
                });
            } else {
                sap.ui.getCore().byId(`${controlId}`).clearSelection();
            }
        },
        handleValueHelp: async function (oEvent) {
            var flocModel = new JSONModel();
            var locModel = new JSONModel();
            var prodModel = new JSONModel();
            var AsmModel = new JSONModel();
            var mStartModel = new JSONModel();
            var mEndModel = new JSONModel();
            var sId = oEvent.getSource().getId();
            if (sId.includes("idFacLocLag")) {
                // that.addSelectAllButtons(that._valueHelpDialogFLoc.getId());
                that._valueHelpDialogFLoc.open();
                that._valueHelpDialogFLoc.setNoDataText("...Loading");
                that._valueHelpDialogFLoc.setBusy(true);
                if (that.totalFilterData && that.totalFilterData.length > 0) {
                    that._valueHelpDialogFLoc.setBusy(false);
                    // that._valueHelpDialogLoc.setModel(new JSONModel([]));
                    if (that.mulInpFLoc.getTokens().length > 0) {
                        that.mulInpFLoc.getTokens().forEach(t => {
                            that._valueHelpDialogFLoc.getItems().forEach((i, ind) => {
                                if (t.getKey() == i.getDescription() || t.getText() == i.getTitle()) {
                                    that._valueHelpDialogFLoc.getItems()[ind].setSelected(true);
                                }
                            });
                        });
                    }
                } else {
                    const oRes = await that.readAllData(that.planModel, "getAssemblyData", { "$skip": 0, "$top": 50000 }, []);

                    that._valueHelpDialogFLoc.setBusy(false);
                    if (oRes.length > 0) {
                        that.totalFilterData = oRes;
                        var unqLocs = oRes.sort(that.dynamicSortMultiple("FACTORY_LOC"));
                        unqLocs = that.removeDuplicates(unqLocs, ['FACTORY_LOC']);
                        flocModel.setData({
                            results: unqLocs
                        });
                        flocModel.setSizeLimit(unqLocs.length);
                        that._valueHelpDialogFLoc.setModel(flocModel);
                        that._valueHelpDialogProd.setModel(new JSONModel([]));
                        if (that.mulInpFLoc.getTokens().length > 0) {
                            that.mulInpFLoc.getTokens().forEach(t => {
                                that._valueHelpDialogFLoc.getItems().forEach((i, ind) => {
                                    if (t.getKey() == i.getDescription() || t.getText() == i.getTitle()) {
                                        that._valueHelpDialogFLoc.getItems()[ind].setSelected(true);
                                    }
                                });
                            });
                        }
                    } else {
                        that._valueHelpDialogFLoc.setNoDataText("No Data");
                    }

                    // })
                }
            }
            if (sId.includes("idLocLag")) {
                // that.addSelectAllButtons(that._valueHelpDialogLoc.getId());
                if (that.mulInpFLoc.getTokens().length > 0) {
                    that._valueHelpDialogLoc.open();
                    that._valueHelpDialogLoc.setNoDataText("...Loading");
                    that._valueHelpDialogLoc.setBusy(true);
                    // if (that._valueHelpDialogLoc.getItems().length > 0) {
                    // that._valueHelpDialogLoc.setBusy(false);
                    // that._valueHelpDialogVer.setModel(new JSONModel([]));
                    if (that.mulInpPro.getTokens().length > 0) {
                        that.mulInpPro.getTokens().forEach(t => {
                            that._valueHelpDialogLoc.getItems().forEach((i, ind) => {
                                if (t.getKey() == i.getDescription() && t.getText() == i.getTitle()) {
                                    that._valueHelpDialogLoc.getItems()[ind].setSelected(true);
                                }
                            });
                        });
                    }
                    // }
                    // else {
                    var sLoc = [], oLocObject = {};
                    that._valueHelpDialogLoc.setBusy(false);
                    // if (oData.results.length > 0) {
                    if (that.totalFilterData.length > 0) {
                        sLoc = that.mulInpFLoc.getTokens().flatMap(l =>
                            that.totalFilterData.filter(K =>
                                l.getText() === K.FACTORY_LOC
                            )
                        );

                        var unqLoc = that.removeDuplicates(sLoc, ['LOCATION_ID']);
                        locModel.setData({
                            results: unqLoc
                        });
                        locModel.setSizeLimit(unqLoc.length);
                        that._valueHelpDialogLoc.setModel(locModel);
                        if (that.mulInpPro.getTokens().length > 0) {
                            that.mulInpPro.getTokens().forEach(t => {
                                that._valueHelpDialogLoc.getItems().forEach((i, ind) => {
                                    if (t.getKey() == i.getDescription() && t.getText() == i.getTitle()) {
                                        that._valueHelpDialogLoc.getItems()[ind].setSelected(true);
                                    }
                                });
                            });
                        }
                        that._valueHelpDialogProd.setModel(new JSONModel([]));
                    } else {
                        that._valueHelpDialogLoc.setNoDataText("No Data");
                    }
                    // }
                    // that._valueHelpDialogLoc.setBusy(false);
                    // that._valueHelpDialogVer.setModel(new JSONModel([]));
                    if (that.mulInpPro.getTokens().length > 0) {
                        that.mulInpPro.getTokens().forEach(t => {
                            that._valueHelpDialogLoc.getItems().forEach((i, ind) => {
                                if (t.getKey() == i.getDescription() && t.getText() == i.getTitle()) {
                                    that._valueHelpDialogLoc.getItems()[ind].setSelected(true);
                                }
                            });
                        });
                    }
                } else {
                    MessageToast.show("Select Location");
                }
            }
            if (sId.includes("idProdLag")) {
                // that.addSelectAllButtons(that._valueHelpDialogProd.getId());
                if (that.mulInpLoc.getTokens().length > 0) {
                    that._valueHelpDialogProd.open();
                    that._valueHelpDialogProd.setNoDataText("...Loading");
                    that._valueHelpDialogProd.setBusy(true);
                    if (that._valueHelpDialogProd.getItems().length > 0) {
                        that._valueHelpDialogProd.setBusy(false);
                        that._valueHelpDialogAsmb.setModel(new JSONModel([]));
                        if (that.mulInpPro.getTokens().length > 0) {
                            that.mulInpPro.getTokens().forEach(t => {
                                that._valueHelpDialogProd.getItems().forEach((i, ind) => {
                                    if (t.getKey() == i.getDescription() && t.getText() == i.getTitle()) {
                                        that._valueHelpDialogProd.getItems()[ind].setSelected(true);
                                    }
                                });
                            });
                        }
                    } else {
                        var sProd = [];
                        that._valueHelpDialogProd.setBusy(false);
                        // if (oData.results.length > 0) {
                        if (that.totalFilterData.length > 0) {
                            let sLoc = that.mulInpFLoc.getTokens().flatMap(l =>
                                that.totalFilterData.filter(K =>
                                    l.getText() === K.FACTORY_LOC
                                )
                            );
                            sProd = that.mulInpLoc.getTokens().flatMap(l =>
                                sLoc.filter(K =>
                                    l.getText() === K.LOCATION_ID
                                )
                            );

                            var unqLoc = that.removeDuplicates(sLoc, ['PRODUCT_ID']);
                            prodModel.setData({
                                results: unqLoc
                            });
                            prodModel.setSizeLimit(unqLoc.length);
                            that._valueHelpDialogProd.setModel(prodModel);
                            if (that.mulInpPro.getTokens().length > 0) {
                                that.mulInpPro.getTokens().forEach(t => {
                                    that._valueHelpDialogProd.getItems().forEach((i, ind) => {
                                        if (t.getKey() == i.getDescription() && t.getText() == i.getTitle()) {
                                            that._valueHelpDialogProd.getItems()[ind].setSelected(true);
                                        }
                                    });
                                });
                            }
                            that._valueHelpDialogAsmb.setModel(new JSONModel([]));
                        } else {
                            that._valueHelpDialogProd.setNoDataText("No Data");
                        }
                    }
                } else {
                    MessageToast.show("Select Demand Location");
                }
            }
            if (sId.includes("idMonStartLag")) {
                that._valueHelpDialogMStart.open();
                that._valueHelpDialogMStart.setNoDataText("...Loading");
                that._valueHelpDialogMStart.setBusy(true);
                if (that._valueHelpDialogMStart.getItems().length > 0) {
                    that._valueHelpDialogMStart.setBusy(false);
                    // if (that.mulInpmStart.getTokens().length > 0) {
                    //     that.mulInpmStart.getTokens().forEach(t => {
                    //         that._valueHelpDialogMStart.getItems().forEach((i, ind) => {
                    //             if (t.getKey() == i.getDescription() && t.getText() == i.getTitle()) {
                    //                 that._valueHelpDialogMStart.getItems()[ind].setSelected(true);
                    //             }
                    //         });
                    //     });
                    // }
                } else {
                    var sProd = [];
                    that._valueHelpDialogMStart.setBusy(false);
                    const afilter = [
                        new Filter("LEVEL", FilterOperator.EQ, "M")
                    ];
                    const oRes = await that.readAllData(that.catModel, "getIBPCalenderWeek", {}, afilter);

                    that._valueHelpDialogFLoc.setBusy(false);
                    if (oRes.length > 0) {
                        let perido = oRes.sort((a, b) => new Date(a.WEEK_STARTDATE) - new Date(b.WEEK_STARTDATE));
                        perido = that.removeDuplicates(perido, ['PERIODDESC']);
                        mStartModel.setData({
                            results: perido
                        });
                        mStartModel.setSizeLimit(perido.length);
                        that._valueHelpDialogMStart.setModel(mStartModel);
                        // if (that._valueHelpDialogMStart.getTokens().length > 0) {
                        //     that._valueHelpDialogMStart.getTokens().forEach(t => {
                        //         that._valueHelpDialogMStart.getItems().forEach((i, ind) => {
                        //             if (t.getKey() == i.getDescription() || t.getText() == i.getTitle()) {
                        //                 that._valueHelpDialogFLoc.getItems()[ind].setSelected(true);
                        //             }
                        //         });
                        //     });
                        // }
                    } else {
                        that._valueHelpDialogFLoc.setNoDataText("No Data");
                    }
                }
            }
            if (sId.includes("idMonEndLag")) {
                that._valueHelpDialogMEnd.open();
                that._valueHelpDialogMEnd.setNoDataText("...Loading");
                that._valueHelpDialogMEnd.setBusy(true);
                if (that._valueHelpDialogMEnd.getItems().length > 0) {
                    that._valueHelpDialogMEnd.setBusy(false);
                    // if (that.mulInpmStart.getTokens().length > 0) {
                    //     that.mulInpmStart.getTokens().forEach(t => {
                    //         that._valueHelpDialogMEnd.getItems().forEach((i, ind) => {
                    //             if (t.getKey() == i.getDescription() && t.getText() == i.getTitle()) {
                    //                 that._valueHelpDialogMEnd.getItems()[ind].setSelected(true);
                    //             }
                    //         });
                    //     });
                    // }
                } else {
                    var sProd = [];
                    that._valueHelpDialogMEnd.setBusy(false);
                    const afilter = [
                        new Filter("LEVEL", FilterOperator.EQ, "M")
                    ];
                    const oRes = await that.readAllData(that.catModel, "getIBPCalenderWeek", {}, afilter);

                    that._valueHelpDialogFLoc.setBusy(false);
                    if (oRes.length > 0) {
                        let perido = oRes.sort((a, b) => new Date(a.WEEK_STARTDATE) - new Date(b.WEEK_STARTDATE));
                        perido = that.removeDuplicates(perido, ['PERIODDESC']);
                        mEndModel.setData({
                            results: perido
                        });
                        mEndModel.setSizeLimit(perido.length);
                        that._valueHelpDialogMEnd.setModel(mEndModel);
                        // if (that.mulInpmStart.getTokens().length > 0) {
                        //     that._valueHelpDialogMEnd.getTokens().forEach(t => {
                        //         that._valueHelpDialogMEnd.getItems().forEach((i, ind) => {
                        //             if (t.getKey() == i.getDescription() || t.getText() == i.getTitle()) {
                        //                 that._valueHelpDialogFLoc.getItems()[ind].setSelected(true);
                        //             }
                        //         });
                        //     });
                        // }
                    } else {
                        that._valueHelpDialogFLoc.setNoDataText("No Data");
                    }
                }
            }

        },
        handleSelectionChange: function (event) {
            // var controlId = event.getSource().sId;
            // var items = sap.ui.getCore().byId(`${controlId}`).getItems();
            // if (items.length > 0) {
            //     var sItems = items.filter(f => f.getSelected() === true);
            //     if (sItems.length === items.length) {
            //         sap.ui.getCore().byId(`${controlId}`)._oDialog.getContent()[0].getItems()[0].setSelected(true);
            //     } else {
            //         sap.ui.getCore().byId(`${controlId}`)._oDialog.getContent()[0].getItems()[0].setSelected(false);
            //     }
            // }
        },
        handleSelection: function (oEvent) {
            // var title = oEvent.getSource().getTitle();
            var oTokensCust = {}, newToken = [];
            var title = oEvent.getSource()._oDialog.getContent()[1].getItems()[0].getText();
            if (title.includes("Factory")) {

                that.mulInpLoc.removeAllTokens();
                that.mulInpLoc.removeAllTokens();
                that.mulInpFLoc.removeAllTokens();
                // that.mulInpAsm.removeAllTokens();
                // that.mulInpmStart.removeAllTokens();
                // that.mulInpmEnd.removeAllTokens();
                // sap.ui.getCore().byId(`idLocDialogLag`)._oDialog.getContent()[0].getItems()[0].setSelected(false);
                // sap.ui.getCore().byId(`idProductDialogLag`)._oDialog.getContent()[0].getItems()[0].setSelected(false);
                // sap.ui.getCore().byId(`idAsmDialogLag`)._oDialog.getContent()[0].getItems()[0].setSelected(false);
                // sap.ui.getCore().byId(`idMStartDialogLag`)._oDialog.getContent()[0].getItems()[0].setSelected(false);
                // sap.ui.getCore().byId(`idMEndDialogLag`)._oDialog.getContent()[0].getItems()[0].setSelected(false);
                var locations = oEvent.getParameters().selectedItems;
                // if (that.mulInpFLoc.getTokens().length != locations.length) {
                locations.forEach(function (oItem) {
                    that.mulInpFLoc.addToken(new Token({
                        text: oItem.getTitle(),
                        key: oItem.getDescription(),
                        editable: false
                    }));
                });
                // }
            }
            if (title.includes("Demand Location")) {
                var locations = oEvent.getParameters().selectedItems;
                that.mulInpPro.removeAllTokens();
                that.mulInpLoc.removeAllTokens();
                // that.mulInpAsm.removeAllTokens();
                // that.mulInpmStart.removeAllTokens();
                // sap.ui.getCore().byId(`idAsmDialogLag`)._oDialog.getContent()[0].getItems()[0].setSelected(false);
                // sap.ui.getCore().byId(`idMStartDialogLag`)._oDialog.getContent()[0].getItems()[0].setSelected(false);
                // sap.ui.getCore().byId(`idMEndDialogLag`)._oDialog.getContent()[0].getItems()[0].setSelected(false);
                // if (that.mulInpLoc.getTokens().length != locations.length) {
                locations.forEach(function (oItem) {
                    that.mulInpLoc.addToken(new Token({
                        text: oItem.getTitle(),
                        key: oItem.getDescription(),
                        editable: false
                    }));
                });
                // }
            }
            if (title.includes("Product")) {
                var products = oEvent.getParameters().selectedItems;
                that.mulInpPro.removeAllTokens();
                // that.mulInpmStart.removeAllTokens();
                // sap.ui.getCore().byId(`idMStartDialogLag`)._oDialog.getContent()[0].getItems()[0].setSelected(false);
                // sap.ui.getCore().byId(`idMEndDialogLag`)._oDialog.getContent()[0].getItems()[0].setSelected(false);
                // if (that.mulInpPro.getTokens().length != products.length) {
                products.forEach(function (oItem) {
                    that.mulInpPro.addToken(new Token({
                        text: oItem.getTitle(),
                        key: oItem.getDescription(),
                        editable: false
                    }));

                });

                // }
            }
            if (title.includes("Month Start")) {
                var mStart = oEvent.getParameters().selectedItems;
                that.mulInpmStart.removeAllTokens();
                // if (that.mulInpmStart.getTokens().length != mStart.length) {
                mStart.forEach(function (oItem) {
                    that.mulInpmStart.addToken(new Token({
                        text: oItem.getTitle(),
                        key: oItem.getDescription(),
                        editable: false
                    }));

                });

                // }
            }

            if (title.includes("Month End")) {
                var mEnd = oEvent.getParameters().selectedItems;
                that.mulInpmEnd.removeAllTokens();
                // if (that.mulInpmEnd.getTokens().length != mEnd.length) {
                mEnd.forEach(function (oItem) {
                    that.mulInpmEnd.addToken(new Token({
                        text: oItem.getTitle(),
                        key: oItem.getDescription(),
                        editable: false
                    }));
                });
                // }
            }

            newToken = [];
        },
        handleClose: function (oEvent) {
            // var title = oEvent.getSource().getTitle();
            var title = oEvent.getSource()._oDialog.getContent()[1].getItems()[0].getText();
            // Loc Dialog
            if (title.includes("Factory")) {
                // that._oCore.byId(this._valueHelpDialogFLoc.getId() + "-searchField").setValue("");
                if (that._valueHelpDialogFLoc.getBinding("items")) {
                    that._valueHelpDialogFLoc.getBinding("items").filter([]);
                }
                // Prod Dialog
            } else if (title.includes("Demand Location")) {
                // that._oCore.byId(this._valueHelpDialogLoc.getId() + "-searchField").setValue("");
                if (that._valueHelpDialogLoc.getBinding("items")) {
                    that._valueHelpDialogLoc.getBinding("items").filter([]);
                }
                // Version Dialog
            } else if (title.includes("Product")) {
                // that._oCore.byId(this._valueHelpDialogProd.getId() + "-searchField").setValue("");
                if (that._valueHelpDialogProd.getBinding("items")) {
                    that._valueHelpDialogProd.getBinding("items").filter([]);
                }
                // Scenario Dialog
            }
        },
        handleSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("value") || oEvent.getParameter("newValue"),
                sId = oEvent.getParameter("id"),
                oFilters = [];
            // Check if search filter is to be applied
            sQuery = sQuery ? sQuery.trim() : "";
            // Location
            if (sId.includes("idFLocDialogLag")) {
                var locList = sap.ui.getCore().byId("idFLocDialogLag");
                var oBinding = locList.getBinding("items");
                if (sQuery !== "") {
                    oFilters.push(
                        new Filter({
                            filters: [
                                new Filter("FACTORY_LOC", FilterOperator.Contains, sQuery),
                                new Filter("FACTORY_LOC", FilterOperator.Contains, sQuery),
                            ],
                            and: false,
                        })
                    );
                }
                oBinding.filter(oFilters);
                if (locList.getItems().length == 0) {
                    locList.setNoDataText("No Locations Found");
                }
                // Product
            } else if (sId.includes("idProductDialogLag")) {
                var proList = sap.ui.getCore().byId("idProductDialogLag");
                var oBinding = proList.getBinding("items");
                if (sQuery !== "") {
                    oFilters.push(
                        new Filter({
                            filters: [
                                new Filter("PRODUCT_ID", FilterOperator.Contains, sQuery),
                                new Filter("PROD_DESC", FilterOperator.Contains, sQuery),
                            ],
                            and: false,
                        })
                    );
                }
                oBinding.filter(oFilters);
                if (proList.getItems().length == 0) {
                    proList.setNoDataText("No Products Found");
                }
                // Version
            }
            else if (sId.includes("idMStartDialogLag")) {
                var verList = sap.ui.getCore().byId("idMStartDialogLag");
                var oBinding = verList.getBinding("items");
                if (sQuery !== "") {
                    oFilters.push(
                        new Filter({
                            filters: [
                                new Filter("PERIODDESC", FilterOperator.Contains, sQuery),
                            ],
                            and: false,
                        })
                    );
                }
                oBinding.filter(oFilters);
                if (verList.getItems().length == 0) {
                    verList.setNoDataText("No Week Found");
                }
                // Scenario
            } else if (sId.includes("idMEndDialogLag")) {
                var scenList = sap.ui.getCore().byId("idMEndDialogLag");
                var oBinding = scenList.getBinding("items");
                if (sQuery !== "") {
                    oFilters.push(
                        new Filter({
                            filters: [
                                new Filter("PERIODDESC", FilterOperator.Contains, sQuery),
                            ],
                            and: false,
                        })
                    );
                }
                oBinding.filter(oFilters);
                if (scenList.getItems().length == 0) {
                    scenList.setNoDataText("No Week Found");
                }
            } else if (sId.includes("_IDGenSearchField1")) {
                if (sQuery !== "") {
                    oFilters.push(
                        new Filter({
                            filters: [
                                new Filter("VARIANTNAME", FilterOperator.Contains, sQuery),
                                new Filter("VARIANTID", FilterOperator.Contains, sQuery)
                            ],
                            and: false,
                        })
                    );
                }
                sap.ui.getCore().byId("varNameList").getBinding("items").filter(oFilters);

            }
        },
        readAllData(oModel, entity, urlParameters, filter = []) {
            let allResults = [];
            let skip = 0;
            const top = urlParameters.$top || 50000; // Use provided top or default to 20,000

            // Function to recursively fetch data
            const fetchData = async () => {
                // Create a copy of urlParameters and update skip
                const currentUrlParameters = { ...urlParameters, $skip: skip };

                try {
                    const { promise, resolve, reject } = Promise.withResolvers();
                    oModel.read(`/${entity}`, {
                        filters: filter,
                        urlParameters: currentUrlParameters,
                        success(oRes) {
                            resolve(oRes.results);
                        },
                        error(oError) {
                            reject(oError);
                        },
                    });
                    const results = await promise;

                    // Add results to collection
                    allResults = allResults.concat(results);

                    // Check if more data is available
                    if (results.length === top) {
                        // Update skip for next batch
                        skip += top;
                        // Recursively fetch more data
                        return await fetchData();
                    } else {
                        // All data retrieved
                        return allResults;
                    }
                } catch (error) {
                    throw error;
                }
            };

            // Start fetching data
            return fetchData();
        },
        callFunction() {
            const [entity, urlParameters] = arguments,
                { promise, resolve, reject } = Promise.withResolvers();
            that.planModel.callFunction(`/${entity}`, {
                urlParameters: urlParameters,
                success(oRes) {
                    resolve(oRes);
                },
                error(oError) {
                    reject(oError);
                },
            })
            return promise;
        },
        async onGo() {
            try {
                that.getView().setBusy(true);
                const FLoc = that.mulInpFLoc.getTokens()[0].getText();
                const Loc = that.mulInpLoc.getTokens()[0].getText();
                const Prod = that.mulInpPro.getTokens()[0].getText();
                const Mstart = that.mulInpmStart.getTokens()[0].getText();
                const MEnd = that.mulInpmEnd.getTokens()[0].getText();
                if (!FLoc || !Loc || !Prod || !Mstart || !MEnd)
                    return MessageToast.show("Select Required Filter");
                let oRes, data, val;

                that.ActualQty = [];
                that.NormalQty = [];
                const assembly = [];
                that.allData = [];
                const type = that.byId("idTypeBox").getSelectedKey();
                if (type === "Assembly") {
                    oRes = await that.callFunction("getAssemblyLagfun", {
                        FACTORY_LOCATION: FLoc, LOCATION: Loc, PRODUCT: Prod, START_MONTH: Mstart, END_MONTH: MEnd
                    });
                    data = JSON.parse(oRes.getAssemblyLagfun);
                    that.staticColumns = ["Assembly", "Lag Month"];
                    that.byId("idAsmBtn").setVisible(true);
                }
                if (type === "Product") {
                    oRes = await that.callFunction("getPrdDmdLagFun", {
                        FACTORY_LOCATION: FLoc, LOCATION: Loc, PRODUCT: Prod, START_MONTH: Mstart, END_MONTH: MEnd
                    });
                    data = JSON.parse(oRes.getPrdDmdLagFun);
                    that.staticColumns = ["Location", "Product", "Lag Month"]
                    that.byId("idAsmBtn").setVisible(false);
                }
                that.allData = data;
                that.updateQty();
                if (type === "Assembly")
                    sap.ui.getCore().byId("asmDetailsDialog").setModel(new JSONModel({ asmDetails: assembly.map(a => { return { ASSEMBLY: a } }) }));
                that.loadPivotTable(that.allData);
                that.getView().setBusy(false);
            } catch (error) {
                console.error(error);
                that.getView().setBusy(false);
            }
        },
        onChnageType() {
            that.onGo();
        },
        onOpenAsm() {
            that.AsmbTable.open();
            // sap.ui.getCore().byId("charDetailsDialog").setModel(that.CharModel);
            sap.ui.getCore().byId("asmDetailsDialog").fireSearch({
                value: ""
            });
        },
        onAssemblySelectionFinish: async function (oEvent) {

            const aSelectedItems = oEvent.getParameter("selectedItems");
            that.selectChar = aSelectedItems;
            if (aSelectedItems.length == 0) {
                that.loadPivotTable(that.allData);
                return;
            }
            let tempdata = JSON.parse(JSON.stringify(that.allData));
            const asm = [];
            aSelectedItems.forEach(function (item) {
                const obj = item.getBindingContext().getObject();
                asm.push(obj.ASSEMBLY);
            });
            tempdata = tempdata.filter(o => asm.includes(o.ASSEMBLY));
            that.loadPivotTable(tempdata);
        },
        handleSearchs: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("ASSEMBLY", FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },
        updateQty() {
            that.ActualQty = [];
            that.NormalQty = [];
            let val;
            if (that.byId("idMapBox").getSelected()) {
                val = ["MAPE"]
            }
            else if (that.byId("idMapQtyBox").getSelected()) {
                val = ["MAPE_QTY"]
            }
            else if (that.byId("idLagQtyBox").getSelected()) {
                val = ["LAG_QTY"]
            }
            that.allData.forEach(o => {
                if (o.LAG_MONTH == 0)
                    that.ActualQty.push(o[val]);
                else
                    that.NormalQty.push(o[val]);
                // if (o.ASSEMBLY)
                //     if (!assembly.includes(o.ASSEMBLY))
                //         assembly.push(o.ASSEMBLY);
            })
        },
        onSelectMap(e) {
            if (e.mParameters.selected) {
                that.byId("idMapQtyBox").setSelected(false);
                that.byId("idLagQtyBox").setSelected(false);
                that.updateQty();
                that.loadPivotTable(that.allData);
            } else {
                that.byId("idMapBox").setSelected(true);
            }
        },
        onSelectMapQty(e) {
            if (e.mParameters.selected) {
                that.byId("idMapBox").setSelected(false);
                that.byId("idLagQtyBox").setSelected(false);
                that.updateQty();
                that.loadPivotTable(that.allData);
            } else {
                that.byId("idMapQtyBox").setSelected(true);
            }
        },
        onSelectLagQty(e) {
            if (e.mParameters.selected) {
                that.byId("idMapBox").setSelected(false);
                that.byId("idMapQtyBox").setSelected(false);
                that.updateQty();
                that.loadPivotTable(that.allData);
            } else {
                that.byId("idLagQtyBox").setSelected(true);
            }
        },
        jsonToPivotData: function (json) {
            const headers = [];
            const keys = Object.keys(json[0]);
            keys.forEach(key => {
                let label;
                switch (key) {
                    case "FACTORY_LOC":
                        label = "Factory Location";
                        break;
                    case "LOCATION_ID":
                        label = "Location";
                        break;
                    case "PRODUCT_ID":
                        label = "Product"
                        break;
                    case "ASSEMBLY":
                        label = "Assembly";
                        break;
                    case "MRP_GROUP":
                        label = "MRP Group";
                        break;
                    case "MRP_TYPE":
                        label = "MRP Type";
                        break;
                    case "SELECTED_MONTH":
                        label = "Telescopic Week";
                        break;
                    case "LAG_MONTH":
                        label = "Lag Month";
                        break;
                    case "ACTUAL_MONTH":
                        label = "Actual Month";
                        break;
                    case "LAG_QTY":
                        label = "Lag Quantity";
                        break;
                    case "ACTUAL_QTY":
                        label = "Actual Quantity";
                        break;
                    case "MAPE":
                        label = "MAPE";
                        break;
                    case "MAPE_QTY_ABS":
                        label = "MAPE Quantity (Absolute)";
                        break;
                    case "MAPE_QTY":
                        label = "MAPE Quantity";
                        break;
                    default:
                        label = key;
                        break;
                }
                headers.push(label);
            });

            const data = json.map(item => Object.values(item));
            return [headers, ...data];
        },
        loadPivotTable: function (data, rows, val) {
            if (!data.length) {
                that.oGModel.setProperty("/showPivot", false);
                that.byId('pivotPageLag').setBusy(false);
                var existingDiv = document.querySelector(`[id*=mainDiv]`);
                if (existingDiv && existingDiv.children.length > 0) {
                    while (existingDiv.firstChild) {
                        existingDiv.removeChild(existingDiv.firstChild);
                    }
                }
                return MessageToast.show("No Data");
            }

            that.oGModel.setProperty("/showPivot", true);
            that.isTableBarChart = true;
            var newDiv = document.createElement("div");
            newDiv.id = `pivotGrid`;
            newDiv.textContent = "";
            var existingDiv = document.querySelector(`[id*='mainDivLag']`);
            if (existingDiv.children.length > 0) {
                while (existingDiv.firstChild) {
                    existingDiv.removeChild(existingDiv.firstChild);
                }
            }
            existingDiv.appendChild(newDiv);
            var pivotDiv = document.querySelector(`[id*='pivotGrid']`);
            // Check if jQuery and PivotUI are available
            if (window.jQuery && window.jQuery.fn.pivot) {
                const tableType = that.oGModel.getProperty("/tableType");
                const isTableType = tableType.includes('Table') ||
                    tableType.includes('Heatmap');
                // var pivotDiv = that.byId("mainDivLag").getDomRef();

                const pivotData = that.jsonToPivotData(data);

                if (!rows) {
                    var rows = that.staticColumns;
                }
                that.staticColumns = rows;
                // if (!val) {
                //     var val = ["MAPE"];
                // }
                if (that.byId("idMapBox").getSelected()) {
                    val = ["MAPE"]
                }
                else if (that.byId("idMapQtyBox").getSelected()) {
                    val = ["MAPE Quantity"]
                }
                else if (that.byId("idLagQtyBox").getSelected()) {
                    val = ["Lag Quantity"]
                }
                that.value = val;
                let
                    // cols = ["Telescopic Week", "Actual Quantity"]
                    cols = ["Telescopic Week"]
                $(pivotDiv).pivotUI(pivotData, {
                    rows: rows,
                    cols: cols,
                    vals: val, // Just use one value for simple sum
                    aggregatorName: "Sum",
                    rendererName: "Heatmap",
                    showUI: false,
                    sorters: {
                        // [cols]: () => 0
                    },
                    renderers: $.extend(
                        $.pivotUtilities.renderers,
                        $.pivotUtilities.plotly_renderers
                    ),
                    rendererOptions: {
                        table: {
                            colTotals: false,
                            rowTotals: false
                        },
                        heatmap: {
                            colorScaleGenerator: function (values, _) {
                                const ignoreValues = that.ActualQty;
                                const normalValue = that.NormalQty;

                                var filteredValues = values.filter(function (v) {
                                    if (v === null || v === undefined) return false;

                                    const inIgnore = ignoreValues.includes(v);
                                    const inNormal = normalValue.includes(v);

                                    // If in both arrays, keep it (don't ignore)
                                    if (inIgnore && inNormal) return true;

                                    // If only in ignore array, filter it out
                                    if (inIgnore && !inNormal) return false;

                                    // Otherwise, keep it
                                    return true;
                                });

                                if (filteredValues.length === 0) return Plotly.d3.scale.linear();

                                var min = Math.min.apply(Math, filteredValues);
                                var max = Math.max.apply(Math, filteredValues);
                                var mid = (min + max) / 2;

                                return Plotly.d3.scale.linear()
                                    .domain([min, mid, max])
                                    .range(["#B3E5FC", "#2196F3", "#0D47A1"]);
                            }
                        }
                    }
                });
                if (isTableType) {
                    // Call function for table-type visualization
                    that.loadPivotCss();
                } else {
                    setTimeout(that.makeChartResponsiveWidth, 500);
                    // Call function for chart-type visualization
                }

                that.byId('pivotPageLag').setBusy(false);
            } else {
                console.error("Pivot.js or jQuery is not loaded yet.");
                that.byId('pivotPageLag').setBusy(false);
            }
        },
        loadPivotCss() {
            $(".pvtTable").ready(function () {
                setTimeout(function () {
                    // Handle chart renderer control


                    // Hide last row (totals row)
                    // $(".pvtTable").find("tr:last").hide();
                    // $(".pvtTable").find('thead:first tr:first th:last-child').hide();

                    // Adjust vertical alignment for headers with large rowspan
                    $(".pvtTable").find('th[rowspan]').each(function () {
                        if (parseInt($(this).attr('rowspan')) > 7) {
                            $(this).css('vertical-align', 'top');
                        }
                    });

                    // $(".pvtTable").find('tbody tr').each(function () {
                    //     var hasEmptyCell = false;
                    //     $(this).find('th').each(function (e) {
                    //         if ($(this).text().trim() === "") {
                    //             hasEmptyCell = true;
                    //         }
                    //     });
                    //     if (hasEmptyCell) {
                    //         $(this).find('td').each(function (e) {
                    //             $(this).addClass('highlight-row');
                    //         });
                    //     }
                    //     // $(this).find('td:last').remove();
                    // })

                    // if (that.weekType === "TELESCOPIC_WEEK") {
                    // const allWeek = $(".pvtTable").find('thead tr:first th');
                    // $(allWeek).each(function (e) {
                    //     const cellText = $(this).text();
                    //     if (that.weekType === "TELESCOPIC_WEEK") {

                    //         if (that.telMonth.includes(cellText))
                    //             $(this).css('background-color', '#ced4da');

                    //         if (that.telQ.includes(cellText))
                    //             $(this).css('background-color', '#adb5bd');

                    //         if (e === allWeek.length - 1)
                    //             $(this).css('background-color', '#adb5bd');
                    //     }

                    //     $(this).addClass('weekHeader');


                    //     const popoverHtml = `<div class="popover">
                    //         <div class="popover-content">
                    //             <div class="date-row">
                    //                 <span class="date-label">From:</span>
                    //                 <span class="From${cellText}">28 April 2025</span>
                    //             </div>
                    //             <div class="date-row">
                    //                 <span class="date-label">To:</span>
                    //                 <span class="To${cellText}">05 May 2025</span>
                    //             </div>
                    //         </div>
                    //     </div>`;

                    //     // Add popover to body
                    //     $(this).append(popoverHtml);

                    //     $(this).hover(
                    //         function () {
                    //             // Mouse enters
                    //             that.updateDate(cellText);
                    //         }
                    //         // ,
                    //         // function () {
                    //         //     // Mouse leaves
                    //         //     yourFunctionOut();
                    //         // }
                    //     );
                    // });


                    // }

                    // Freeze columns in thead
                    function freezeHeaderColumns() {
                        // Process first row of thead
                        const firstHeadRow = $(".pvtTable").find('thead tr:first');
                        if (firstHeadRow.length) {
                            let widthsHead = [0];

                            // Calculate cumulative widths for first 3 columns (Location, Product, Assembly)
                            const columnsToFreeze = Math.min(2, firstHeadRow.find('th').length);
                            // const columnsToFreeze = 2;
                            for (let i = 0; i < columnsToFreeze; i++) {
                                const th = firstHeadRow.find(`th:eq(${i})`);
                                if (th.length) {
                                    const borderWidth = parseFloat(th.css('border-left-width') || '0') +
                                        parseFloat(th.css('border-right-width') || '0');
                                    const paddingWidth = parseFloat(th.css('padding-left') || '0') +
                                        parseFloat(th.css('padding-right') || '0');
                                    const width = parseFloat(th.css("width") || '0') + borderWidth + paddingWidth;
                                    widthsHead.push(widthsHead[i] + width);
                                }
                            }

                            // Apply freeze positioning
                            firstHeadRow.find('th').each(function (index) {
                                if (index < columnsToFreeze) {
                                    $(this).addClass('frezzThead');
                                    $(this).css('left', `${widthsHead[index]}px`);
                                }
                            });
                        }

                        // Process second row of thead (axis labels)
                        const secondHeadRow = $(".pvtTable").find('thead tr:eq(1)');
                        if (secondHeadRow.length) {
                            let widthsHead2 = [0];
                            const thElements = secondHeadRow.find('th');
                            const columnsToFreeze = thElements.length

                            // Calculate widths for columns to freeze
                            for (let i = 0; i < columnsToFreeze; i++) {
                                const th = thElements.eq(i);
                                const borderWidth = parseFloat(th.css('border-left-width') || '0') +
                                    parseFloat(th.css('border-right-width') || '0');
                                const paddingWidth = parseFloat(th.css('padding-left') || '0') +
                                    parseFloat(th.css('padding-right') || '0');
                                const width = parseFloat(th.css("width") || '0') + borderWidth + paddingWidth;
                                widthsHead2.push(widthsHead2[i] + width);
                            }

                            // Apply freeze positioning
                            thElements.each(function (index) {
                                if (index < columnsToFreeze) {
                                    $(this).addClass('frezzThead');
                                    $(this).css('left', `${widthsHead2[index]}px`);
                                }
                            });
                        }
                    }

                    // Freeze columns in tbody
                    function freezeBodyColumns() {
                        const tbody = $(".pvtTable").find('tbody');
                        if (!tbody.length) return;

                        // Find row with most th elements to use as reference
                        let maxThCount = 0;
                        let referenceRow = null;

                        tbody.find('tr').each(function () {
                            const thCount = $(this).find('th').length;
                            if (thCount > maxThCount) {
                                maxThCount = thCount;
                                referenceRow = $(this);
                            }
                        });

                        if (!referenceRow || maxThCount === 0) return;

                        // Calculate cumulative widths for the columns to freeze
                        let widths = [0];
                        for (let i = 0; i < maxThCount; i++) {
                            const th = referenceRow.find(`th:eq(${i})`);
                            if (th.length) {
                                const borderWidth = parseFloat(th.css('border-left-width') || '0') +
                                    parseFloat(th.css('border-right-width') || '0');
                                const paddingWidth = parseFloat(th.css('padding-left') || '0') +
                                    parseFloat(th.css('padding-right') || '0');
                                const width = parseFloat(th.css("width") || '0') + borderWidth + paddingWidth;
                                widths.push(widths[i] + width);
                            }
                        }

                        // Apply freeze positioning to each row
                        tbody.find('tr').each(function () {
                            const thElements = $(this).find('th');
                            const currentThCount = thElements.length;

                            thElements.each(function (index) {
                                // Adjust for rows with fewer th elements than the reference row
                                let positionIndex = index;
                                if (currentThCount < maxThCount) {
                                    // Calculate offset based on hierarchy level
                                    positionIndex += (maxThCount - currentThCount);
                                }

                                $(this).addClass('frezz');
                                $(this).css('left', `${widths[positionIndex]}px`);
                            });
                        });
                    }

                    // Format number cells (remove decimals, replace empty cells with 0)
                    function formatCells() {
                        $(".mainDivClass .pvtTable")
                            .find("td")
                            .each(function () {
                                let cellText = $(this).text().trim();
                                if (cellText === "") {
                                    $(this).text("0");
                                }
                                if (cellText.includes(".")) {
                                    $(this).text(cellText.split(".")[0]);
                                }
                                let rowHeader = $(".pvtTable").find(`tr:eq(${$(this)?.parent()?.index() + 2}) th`).filter((_, th) => $(th).text().trim() == "0").length > 0 ? '0' : "";
                                if (rowHeader == '0') {
                                    $(this).closest('tr').find('td').addClass('actual');
                                }
                            });
                    }

                    // Execute all functions
                    freezeHeaderColumns();
                    freezeBodyColumns();
                    // if (that.isTableBarChart)
                    formatCells();
                }, 300); // Delay to ensure table is fully rendered
            });
        },
        updateDate(week) {
            try {
                const Calendar = Array.isArray(that.calWeekData)
                    ? that.calWeekData.filter(o => o && o[that.weekType] == week)
                    : [];

                const fromElem = document.getElementsByClassName(`From${week}`)[0];
                const toElem = document.getElementsByClassName(`To${week}`)[0];

                if (Calendar.length === 0) {
                    $('.popover').hide()
                    return;
                }
                $('.popover').show()
                const startDate = Calendar[0]?.WEEK_STARTDATE instanceof Date
                    ? Calendar[0].WEEK_STARTDATE
                    : new Date(Calendar[0]?.WEEK_STARTDATE);
                const endDate = Calendar[Calendar.length - 1]?.WEEK_ENDDATE instanceof Date
                    ? Calendar[Calendar.length - 1].WEEK_ENDDATE
                    : new Date(Calendar[Calendar.length - 1]?.WEEK_ENDDATE);

                const startDateStr = isNaN(startDate) ? "" : startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                const endDateStr = isNaN(endDate) ? "" : endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

                if (fromElem) fromElem.innerHTML = startDateStr;
                if (toElem) toElem.innerHTML = endDateStr;

            } catch (e) {
                console.error("Error in updateDate:", e);
            }
        },
        dynamicSortMultiple: function () {
            let props = arguments;
            const that = this;
            return function (obj1, obj2) {
                var i = 0,
                    result = 0,
                    numberOfProperties = props.length;
                while (result === 0 && i < numberOfProperties) {
                    result = that.dynamicSort(props[i])(obj1, obj2);
                    i++;
                }
                return result;
            };
        },
        dynamicSort: function (property) {
            var sortOrder = 1;
            if (property[0] === "-") {
                sortOrder = -1;
                property = property.substr(1);
            }
            return function (a, b) {
                var result =
                    a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
                return result * sortOrder;
            };
        },
        removeDuplicate: function (array, key) {
            var check = new Set();
            return array.filter(obj => !check.has(obj[key]) && check.add(obj[key]));
        },
        removeDuplicates: function (array, keys) {
            const filtered = array.filter(
                (s => o =>
                    (k => !s.has(k) && s.add(k))
                        (keys.map(k => o[k]).join('|'))
                )
                    (new Set)
            );
            return filtered;
        },
    });
});