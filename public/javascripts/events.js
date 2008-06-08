var Events = {
  updateBucketsFor: function(section, reset) {
    var acctSelect = $('account_for_' + section);
    var disabled = acctSelect.selectedIndex == 0;
    var acctId = disabled ? null : parseInt(acctSelect.options[acctSelect.selectedIndex].value);

    Events.getBucketSelects(section).each(function(bucketSelect) {
      Events.populateBucket(bucketSelect, acctId, {'reset':reset, 'disabled':disabled});
    });
  },

  populateBucket: function(select, acctId, options) {
    options = options || {};

    var selected = select.options[select.selectedIndex].value;
    for(var i = 0; i < select.options.length; i++) {
      select.options[0] = null;
    }

    if(options['disabled']) {
      select.disabled = true;
      select.options[0] = new Option("-- Select an account --", "");
    } else {
      select.disabled = false;

      i = 0;
      Events.accounts[acctId].buckets.each(function(bucket) {
        select.options[i++] = new Option(bucket.name, bucket.id);
      })

      if(select.hasClassName("splittable")) {
        select.options[i++] = new Option("-- More than one --", "+");
      }

      select.options[i++] = new Option("-- Add a new bucket --", "++");
      if(!options['reset']) Events.selectBucket(select, selected);
    }
  },

  handleAccountChange: function(select, section) {
    $(section + '.multiple_buckets').hide();
    $(section + '.line_items').innerHTML = "";
    $(section + '.single_bucket').show();

    Events.updateBucketsFor(section, true);

    if(section == 'payment_source') {
      $('check_options').hide();
      $('credit_options').hide();

      if(select.selectedIndex > 0) {
        var acctId = parseInt(select.options[select.selectedIndex].value);
        var account = Events.accounts[acctId];

        switch(account.role) {
          case 'credit-card':
            $('credit_options').show();
            break;
          case 'checking':
            $('check_options').show();
            break;
        }
      }
    }
  },

  bucketComparer: function(a, b) {
    if(a.name == b.name) return 0;
    if(a.name < b.name) return -1;
    return 1;
  },

  handleBucketChange: function(select, section) {
    var selected = select.options[select.selectedIndex].value;

    if(selected == '+') {
      Events.addLineItemTo(section);
      Events.addLineItemTo(section);
      $(section + '.multiple_buckets').show();
      $(section + '.single_bucket').hide();
      Events.updateBucketsFor(section);

    } else if(selected == '++') {
      var acctSelect = $('account_for_' + section);
      var acctId = parseInt(acctSelect.options[acctSelect.selectedIndex].value);

      var name = prompt('Name your new bucket:');
      var value = "!" + name;
      Events.accounts[acctId].buckets.push({'id':value,'name':name});
      Events.accounts[acctId].buckets.sort(Events.bucketComparer);
      Events.updateBucketsFor(section);
      Events.selectBucket(select, value);
    }
  },

  selectBucket: function(select, value) {
    for(var i = 0; i < select.options.length; i++) {
      if(select.options[i].value == value) {
        select.selectedIndex = i;
        break;
      }
    }
  },

  getBucketSelects: function(section) {
    return $$('#' + section + ' select.bucket_for_' + section);
  },

  addLineItemTo: function(section, populate) {
    var ol = $(section + ".line_items");
    var li = document.createElement("li");
    li.innerHTML = $('template.' + section).innerHTML;
    ol.appendChild(li);
    if(populate) {
      var acctSelect = $('account_for_' + section);
      var acctId = parseInt(acctSelect.options[acctSelect.selectedIndex].value);
      Events.populateBucket(li.down("select"), acctId);
    }
  },

  removeLineItem: function(li) {
    li.remove();
    Events.updateUnassigned();
  },

  updateUnassigned: function() {
    Events.updateUnassignedFor('payment_source');
    Events.updateUnassignedFor('credit_options');
  },

  updateUnassignedFor: function(section) {
    var total = Money.parse('expense_total');
    var unassigned = total;

    var line_items = $(section + ".line_items");
    line_items.select("input[type=text]").each(function(field) {
      var value = Money.parse(field);
      unassigned -= value;
    });

    if(unassigned > 0) {
      $(section + ".unassigned").innerHTML = "<strong>$" + Money.dollars(unassigned) + "</strong> of $" + Money.dollars(total) + " remains unallocated.";
    } else if(unassigned < 0) {
      $(section + ".unassigned").innerHTML = "You've overallocated <strong>$" + Money.dollars(unassigned) + "</strong>.";
    } else {
      $(section + ".unassigned").innerHTML = "";
    }
  },

  serialize: function(parent) {
    var data = "";
    Form.getElements(parent).each(function(field) {
      if(data.length > 0) data = data + "&";
      data = data + encodeURIComponent(field.name) + "=" + encodeURIComponent($F(field));
    });
    return data;
  },

  submit: function(form) {
    var data = Events.serialize('general_information') +
      Events.serialize('payment_source');

    alert(data);
  }
}