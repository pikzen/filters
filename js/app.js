String.prototype.padLeft = function (length, character) { 
     return new Array(length - this.length + 1).join(character || '0') + this; 
}

/*
* Represents the base type of a single item
*/
function ItemType() {
	this.Type = ko.observable("armingaxe");
}

function Class() {
	this.Class = ko.observable("amulet")
}

/*
* Represents an additional filter
* An additional filter can be an ItemLevel, Rarity, etc... It may also
* hold other parameters such as value, comparison operator, etc.
* Gives info related to what data it needs to display the appropriate
* UI.
*/
function AdditionalFilter() {
	if (typeof this.ID === 'undefined')
		this.ID = 0;
	this.ID = this.ID++;

	var self = this;
	this.FilterType = ko.observable("ilvl");
	this.NeedsComparator = ko.computed(function() {
		return self.FilterType() == "ilvl" ||
		       self.FilterType() == "rarity" ||
		       self.FilterType() == "sockets" ||
		       self.FilterType() == "linked" ||
		       self.FilterType() == 'quality' ||
		       self.FilterType() == 'droplevel';
	});
	this.NeedsValue = ko.computed(function() {
		return self.FilterType() != "class" &&
		       self.FilterType() != "basetype" &&
		       self.FilterType() != 'rarity';
	});
	this.NeedsRarity = ko.computed(function() {
		return self.FilterType() == "rarity";
	});
	this.NeedsClass = ko.computed(function() {
		return self.FilterType() == "class";
	});
	this.NeedsBaseType = ko.computed(function() {
		return self.FilterType() == "basetype";
	});
	this.NeedsNamedAttribute = ko.computed(function() {
		return self.FilterType() != "class" &&
			   self.FilterType() != "basetype";
	});
	this.NeedsDisplayBox = ko.computed(function() {
		return self.FilterType() == 'bgcolor' ||
			   self.FilterType() == 'bordercolor' ||
			   self.FilterType() == 'color';
	});

	this.FilterComparator = ko.observable("l");
	this.FilterValue = ko.observable("0");
	this.FilterRarity = ko.observable("normal");
	this.FilterClass = ko.observable("amulets");
	this.FilterBaseType = ko.observable("");

	var color_function = function(def, filtername, prefix) {
		if (self.FilterType() != filtername)
			return def;

		if (self.FilterValue() == "") 
			return def;

		var splitted = self.FilterValue().split(" ");
		if (splitted.length != 3)
			return def;
		

		return prefix + " #" + parseInt(splitted[0]).toString(16).padLeft(2, '0') + 
			         parseInt(splitted[1]).toString(16).padLeft(2, '0') +  
			         parseInt(splitted[2]).toString(16).padLeft(2, '0');
	};
	this.FilterBGColor     = ko.computed(function() { 
		return color_function("#444", "bgcolor", "") 
	});
	this.FilterBorderColor = ko.computed(function() { 
		return color_function("0px solid white", "bordercolor", "5px solid") 
	});
	this.FilterTextColor       = ko.computed(function() { 
		return color_function("white", "color", "") 
	});
}

/*
* Represents a single filter
* Hold info about showing or hiding it, a list of base types that it
* should apply to, as well as a list of additional filters.
*/
function FilterViewModel() {
	FilterViewModel.ID++;

	this.Show = ko.observable("show");
	this.AdditionalFilters = ko.observableArray([new AdditionalFilter()]);
	var self = this;
	this.AddFilter = function() {
		this.AdditionalFilters.push(new AdditionalFilter());
	}
	this.DeleteFilter = function(item) {
		self.AdditionalFilters.remove(item);
	}

	this.collapseFilter = ko.observable(false);
	this.AttrName = function() {
		return "collapse-checkbox-" + FilterViewModel.ID;
	}
}

FilterViewModel.ID = 0;

function AppViewModel() {
	this.translator = [];
	this.init = false;
	var self = this;
	this.__init = function() {
		this.translator["item-type"] = [];
		this.translator["item-type"]['chests']  = "Chestpieces";
		this.translator["item-type"]['helms']   = "Helmets";
		this.translator["item-type"]['boots']   = "Boots";
		this.translator["item-type"]['gloves']  = "Gloves";
		this.translator["item-type"]['rings']   = "Rings";
		this.translator["item-type"]['belts']   = "Belts";
		this.translator["item-type"]['shields'] = "Shields";
		this.translator["item-type"]['amulets'] = "Amulets";
		this.translator["item-type"]['gems']    = "Gems";
		this.translator["item-type"]['currency']   = "Currency";
		

		this.translator["comparators"] = [];
		this.translator["comparators"]['l']  = "<";
		this.translator["comparators"]['le'] = "<=";
		this.translator["comparators"]['e']  = "";
		this.translator["comparators"]['ge'] = ">=";
		this.translator["comparators"]['g']  = ">";

		this.translator["additional-filter"] = [];
		this.translator["additional-filter"]['ilvl']   = "ItemLevel";
		this.translator["additional-filter"]['rarity'] = "Rarity";
		this.translator["additional-filter"]['basetype'] = "";
		this.translator["additional-filter"]['class'] = '';
		this.translator["additional-filter"]['sound'] = "PlayAlertSound";
		this.translator["additional-filter"]['sockets'] = "Sockets";
		this.translator["additional-filter"]['linked'] = "LinkedSockets";
		this.translator["additional-filter"]['socketgroup'] = "SocketGroup";
		this.translator["additional-filter"]['bordercolor'] = "SetBorderColor";
		this.translator["additional-filter"]['bgcolor']     = "SetBackgroundColor";
		this.translator["additional-filter"]['quality']     = "Quality";
		this.translator["additional-filter"]['droplevel']   = "DropLevel";
		this.translator["additional-filter"]['color']   = "SetTextColor";

		this.translator["rarity"] = [];
		this.translator["rarity"]["normal"] = "Normal";
		this.translator["rarity"]["magic"]  = "Magic";
		this.translator["rarity"]["rare"]   = "Rare";
		this.translator["rarity"]["unique"] = "Unique";

		this.init = true;
	};
	this.filters = ko.observableArray([
		new FilterViewModel()
	]);

	// ================================================================

	this.addNewFilter = function() {
		if (!this.init) this.__init();

		this.filters.push(new FilterViewModel());
	};

	this.dropFilter = function(item) {

		self.filters.remove(item);
	}

	this.moveToTop = function(item) {
		self.filters.unshift(self.filters.remove(item)[0]);
	}

	this.ValueForKey = function(category, item) {
		if (!this.init) this.__init();

		return this.translator[category][item];
	}
	this.ValueForKeys = function(category, list) {
		if (!this.init) this.__init();

		var str = "";
		var self = this;

		str += list.map(function(item) {
			return '"' + self.ValueForKey(category, item.Type()) + '"';
		}).join(" ");

		return str;
	};

	this.RenderFilterFile = ko.computed(function() {
		if (!this.init) this.__init();

		var str = "";

		for (var i = 0; i < this.filters().length; i++){
			var filter = this.filters()[i];
			var basetypes = [];
			var classes = [];
			if (filter.Show() == "show") str += "Show\n";
			else                         str += "Hide\n";

			for (var j = 0; j < filter.AdditionalFilters().length; j++) {

				var add = filter.AdditionalFilters()[j];
				if (add.NeedsNamedAttribute()) {
					str += "	";
					str += this.ValueForKey("additional-filter", add.FilterType());
				}

				if (add.NeedsComparator())
					str += " " + this.ValueForKey("comparators", add.FilterComparator());

				if (add.NeedsValue())
					str += " " + add.FilterValue();

				if (add.NeedsRarity())
					str += " " + this.ValueForKey("rarity", add.FilterRarity());

				if (add.NeedsClass())
					classes.push(this.ValueForKey("item-type", add.FilterClass()));

				if (add.NeedsBaseType())
					basetypes.push(add.FilterBaseType());

				if (add.NeedsNamedAttribute())
					str += "\n";
			}

			if (classes.length > 0) {
				str += "	Class ";
				str += classes.map(function(item) {
					return '"	' + item + '"';
				}).join(" ");
				str += "\n";
			}

			if (basetypes.length > 0) {
				str += "	BaseType "
				str += basetypes.map(function(item) {
					return '"' + item + '"';
				}).join(" ");
				str += "\n";
			}
		}

		

		return str;
	}, this);
};

var model = new AppViewModel();
for (var i = model.filters.length - 1; i >= 0; i--) {
	ko.applyBindings(model.filters[i]);
};


ko.applyBindings(AppViewModel);