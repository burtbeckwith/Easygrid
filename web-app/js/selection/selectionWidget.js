
// create custom widget for autocomplete
$(function() {

    $.widget( "easygrid.selectionComp", {
        // default options
        options: {
            gridName: null,
            urlAjaxAutocomp: null,
            urlAjaxGrid: null,
            urlAjaxSelLabel: null,

            showAutocompleteBox: true,
            staticConstraints: {},
            dynamicConstraints: {},

            label: null,
            idValue: null,
            value: null,

            autocompleteSize:3,
            autocomMinLength:2,
            disabled:false,

            onlyValue: null,
            inputElem:null,
            labelDiv:null,

            baseId:null,
            width: 940,
            height: 400,
            title: '',

            // callbacks
            changeData: function(x) {
                var widget = $('#'+this.id);
                var val =widget.selectionComp('option','onlyValue');
                if(val){
                    var item = val[0];
                    widget.selectionComp('setValue',item.id, item.label);
                }else{
                    //todo - check if showAutocomplete
                    widget.selectionComp('option','inputElem','');
                }
            }

        },  //end options

        // the constructor
        _create: function() {
            var thisWidget = this;
            var elemId =this.element.attr('id');
            this.options.baseId=elemId;
            var parent = this.element.parent();
//                var parent = $('<div style="display:inline;"></div>');
//                this.element.parent().append(parent);

            if(this.options.showAutocompleteBox){
                // add autocomplete field
                this.options.inputElem = $('<input type="text" />');
                this.options.inputElem.attr('size',this.options.autocompleteSize);
                this.options.inputElem.attr('id',elemId+'_autocomplete');
                this.options.inputElem.attr('disabled',this.options.disabled);
                this.options.inputElem.addClass('selcomp_autocomplete_input');
                this.options.inputElem.change(function() {
                    thisWidget._trigger('changeData');
                });
                parent.append(this.options.inputElem);
                var urlAjaxAutocomp = this.options.urlAjaxAutocomp;

                this.options.inputElem.autocomplete({
                    source:function (request, response) {
                        jQuery.ajax({
                            url:urlAjaxAutocomp,
                            data: $.extend({}, thisWidget.options.staticConstraints, {term: request.term}, objectMap(thisWidget.options.dynamicConstraints, function (k,v) {return {key:k,value:jQuery(v).val()}})),
                            success:function (data) {
                                //                            console.log(data);
                                if (data.length == 1) {
                                    thisWidget.options.onlyValue = jQuery.map(data, function (item) { return { id:item.id, label:item.label,value:item.value}});
                                } else {
                                    thisWidget.options.onlyValue = null;
                                }

                                response(
                                    jQuery.map(data, function (item) {
                                            return { id:item.id, label:item.label, value:item.value }
                                        }
                                    ));// over response

                            }, //over success
                            error:function (error) {
                            }
                        });
                    }, //over source

                    minLength: thisWidget.options.autocomMinLength,

                    select: function (event, ui) {
                        thisWidget.setValue(ui.item.id, ui.item.label);
                        return false;
                    }
                });  //autocomplete

            }

            // add selection button
//                var selButton = $('<div  style="display:inline;"/>');
            var selButton = $('<a href="#">Sel    <a>');
//                selButton.children('span:first-child').addClass('selcomp_button').addClass('ui-icon');
//                selButton.addClass('whiteBtn');
            parent.append(selButton);
            selButton.click(function(event){
                thisWidget.showJQGridSelectionPopup();
                return false;
            });

            // add label div
            this.options.labelDiv = $('<div style="display:inline;"/>');
            this.options.labelDiv.attr('id',elemId+'_label');
            this.options.labelDiv.addClass('selcomp_label');
            this.options.labelDiv.dblclick(function(event){
                thisWidget.clear();
                return false;
            });
            parent.append(this.options.labelDiv);

        }, //end _create

        _destroy: function() {
        },


        getValue: function () { return this.options.idValue; },
        setValue: function (id,label) {
            //            console.log('setvalue: '+label);
            this.options.idValue = id;
            this.options.label = label;

            this.element.val(id);
            this.options.labelDiv.text(label);

            //hack
            $('#'+this.options.baseId+'_autocomplete').val('');

            this._trigger('change');
        },
        clear: function(){this.setValue(null,'')},

        showJQGridSelectionPopup: function(){
            var thisWidget = this;
            var tag = $("<div></div>");
            tag.attr('title', thisWidget.options.title);
            $.ajax({
                url: this.options.urlAjaxGrid,
                data: $.extend({}, thisWidget.options.staticConstraints, {selectionComp:true}, objectMap(thisWidget.options.dynamicConstraints, function (k,v) {return {key:k,value:jQuery(v).val()}})),
                dataType : "html",
                success: function(data) {
                    tag.dialog({
                        modal: true,
                        width: thisWidget.options.width,
                        height: thisWidget.options.height,
                        close:function (ev, ui) {
                            tag.remove();
                            $(this).remove();
                        }
                    }).dialog('open');
                    tag.html(data);

                    //only for jqgrid for now
                    $('#'+thisWidget.options.gridName+'_table').jqGrid('setGridParam', {
                        onSelectRow: function(id){
                            //only for GORM
                            thisWidget.setLabel(id);
                            tag.dialog('close');
                            tag.remove();
                        }
                    });
                }
            });
        },

        setLabel: function(id ){
            var thisWidget = this;
            jQuery.ajax({
                url:this.options.urlAjaxSelLabel,
                dataType: 'json',
                data:{
                    id:id
                },
                success:function (data) {
                    thisWidget.setValue(id, data[0].label);

                }, //over success
                error:function (error) {
                }
            });
        }

    }); // end widget declaration
});

/**
 * utility function that transforms a kev-value pair to a new key-value pair
 * @param initial
 * @param callback
 * @return {Object}
 */
function objectMap(initial, callback){
    var newObject = {};
    jQuery.each(initial, function(k,v){
        var result = callback.call({},k,v);
        if(result.value != ''){
            newObject[result.key]=result.value;
        }
    });
    return newObject
}
