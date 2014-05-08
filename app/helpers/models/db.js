/**
 * DB Models
 *
 */

var mongoose = require('mongoose'),
    crypto   = require('crypto'),
    Schema   = mongoose.Schema;


/**
 * Subject (schedule item)
 */

var subjectSchema = new Schema({
  name      : { type : String, default : '' },
  days      : [{
    date     : { type : Date,   default : 0 },
    duration : { type : Number, default : 0 }
  }],
  rooms     : [{ type : Schema.Types.ObjectId, ref : 'Room' }],
  groups    : [{ type : Schema.Types.ObjectId, ref : 'Group' }],
  teachers  : [{ type : Schema.Types.ObjectId, ref : 'Teacher' }],
  coursenum : { type : String, default : '' },
  user      : { type : Schema.Types.ObjectId, ref : 'User' },
  parse     : { type : Schema.Types.ObjectId, ref : 'Parse' },
  createdAt : { type : Date, default : Date.now }
});

/**
 * New vesion
 *

var subjectSchema = new Schema({
  name      : { type : String, default : '' },
  coursenum : { type : String, default : '' },
  user      : { type : Schema.Types.ObjectId, ref : 'User' },
  parse     : { type : Schema.Types.ObjectId, ref : 'Parse' },
  createdAt : { type : Date, default : Date.now }
});

subjectSchema.methods = {

  addEntry : function (entry, cb) {
    if(typeof entry !== 'object') return cb(new Error('Wrong entry'));

    var e = entry;
    e.subject = this._id;

    mongoose.model('Entry').save(e, function (err, entry) {
      cb(err, entry);
    });
  }
};

*/


subjectSchema.methods = {
  addDate : function (date, cb) {
    var d   = new Date(date),
        add = true;
    for(var i = 0; i < this.dates.length; i += 1)
      if(this.dates[i].getTime() === d.getTime())
        add = false;

    if(add)
      this.dates.push(d);

    cb = cb || null;
    this.save(cb);
  },

  addDay : function (day, cb) {
    var d   = new Date(day.date),
        add = true;
    for(var i = 0; i < this.days.length; i += 1)
      if(this.days[i].date.getTime() === d.getTime())
        add = false;

    if(add)
      this.days.push(day);

    cb = cb || null;
    this.save(cb);
  }
};

mongoose.model('Subject', subjectSchema);

/**
 * Daytime entry

var entrySchema = new Schema({
  subject   : { type : Schema.Types.ObjectId, ref : 'Subject' },
  date      : { type : Date,   default : 0 },
  duration  : { type : Number, default : 0 },
  rooms     : [{ type : Schema.Types.ObjectId, ref : 'Room' }],
  groups    : [{ type : Schema.Types.ObjectId, ref : 'Group' }],
  teachers  : [{ type : Schema.Types.ObjectId, ref : 'Teacher' }],
  parse     : { type : Schema.Types.ObjectId, ref : 'Parse' },
  createdAt : { type : Date, default : Date.now }
});

mongoose.model('Entry', entrySchema);

*/

/**
 * Room
 */

var roomSchema = new Schema({
  name      : { type : String, default : '' },
  building  : { type : Schema.Types.ObjectId, ref : 'Building' },
  capacity  : { type : Number, default : 0 },
  createdAt : { type : Date,   default : Date.now }
});

roomSchema.statics = {

  /**
   * Return all rooms in ascendant order
   */
  getAll : function (cb) {
    this
      .find({})
      .sort({ 'name' : 1 })
      .exec(cb);
  }

};

roomSchema.index({ name : 1 }, { unique : true });

mongoose.model('Room', roomSchema);


/**
 * Teacher
 */

var teacherSchema = new Schema({
  name      : { type : String, default : '' },
  building  : { type : Schema.Types.ObjectId, ref : 'Building' },
  createdAt : { type : Date,   default : Date.now }
});

teacherSchema.statics = {

  /**
   * Return all teachers in ascendant order
   */
  getAll : function (cb) {
    this
      .find({})
      .sort({ 'name' : 1 })
      .exec(cb);
  }

};

teacherSchema.index({ name : 1 }, { unique : true });

mongoose.model('Teacher', teacherSchema);


/**
 * Group
 */

var groupSchema = new Schema({
  name      : { type : String, default : '' },
  building  : { type : Schema.Types.ObjectId, ref : 'Building' },
  createdAt : { type : Date,   default : Date.now }
});

groupSchema.statics = {

  /**
   * Return all groups in ascendant order
   */
  getAll : function (cb) {
    this
      .find({})
      .sort({ 'name' : 1 })
      .exec(cb);
  }

};

groupSchema.index({ name : 1 }, { unique : true });

mongoose.model('Group', groupSchema);


/**
 * Parse
 */

var parseSchema = new Schema({
  link        : { type : String,  default : '' },
  group       : { type : Schema.Types.ObjectId, ref : 'Group' },
  customName  : { type : String,  default : '' },
  startNum    : { type : Number,  default : 0 },
  version     : { type : Number,  default : 0 },
  parsed      : { type : Boolean, default : false },
  description : { type : String,  default : '' },
  building    : { type : String,  default : '' },
  outcome     : {
    weeks    : { type : Number, default : 0 },
    subjects : { type : Number, default : 0 }
  },
  createdAt   : { type : Date,    default : Date.now }
});

parseSchema.pre('save', function (next, done) {
  var link = this.link,
      groupname;

  if(link.length < 1)
    done('Url is too short');

  link  = link.split('/');

  this.building = link[link.length-3];
  link = link[link.length-1];

  this.startNum = +link.slice(1, 5);
  this.link = this.link.replace(this.startNum, '{s}');

  link = link.split('.');
  link = link[0];

  this.version = +link.slice(-3);
  this.link = this.link.replace(this.version + '.', '{v}.');

  if(this.customName.length > 0) {
    this.link = this.link.replace(this.customName, '{g}');
    next();
  }
  else {
    groupname = link.slice(5, -3);
    this.link = this.link.replace(groupname, '{g}');

    var Group = mongoose.model('Group'),
        that = this;
    Group.findOne({ name: new RegExp(groupname, "i") }, function (err, group) {
      if(err) console.log(err);

      if(group) {
        that.group = group._id;
        next();
      }
      else done('No group found');
    });
  }

});

mongoose.model('Parse', parseSchema);


/**
 * Messages from the main page
 */

var contactSchema = new Schema({
  message   : { type : String, default : '' },
  from      : { type : String, default : '' },
  user      : { type : Schema.Types.ObjectId, ref: 'User' },
  createdAt : { type : Date,   default : Date.now }
});

contactSchema.index({ "createdAt" : 1 }, { expireAfterSeconds : (60*60*24*60) });

mongoose.model('Contact', contactSchema);


/**
 * Users
 */

var userSchema = new Schema({
  username  : { type : String, default : '', required : true },
  password  : { type : String, default : '', required : true },
  salt      : { type : String, default : '' },
  email     : { type : String, default : '' },
  group     : { type : Schema.Types.ObjectId, ref : 'Group' },
  roles     : {
    admin : { type : Boolean, default : false }
  },
  createdAt : { type : Date,   default : Date.now }
});

userSchema.pre('save', function (next, done) {
  if(!this.username.match(/^[0-9a-z\-\_]+$/i)) return done(new Error('Only characters, numbers, "_" and "-" in username'));
  if(this.password.length < 4) return done(new Error('Password is too short, use more than 3 characters'));

  this.salt = this.makeSalt();
  this.password = this.encryptPassword(this.password);
  next();
});


userSchema.methods = {

  authenticate : function (plainText) {
    return this.encryptPassword(plainText) === this.password;
  },

  makeSalt : function () {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  },

  encryptPassword : function (password) {
    if (!password) return '';
    var encrypred;
    try {
      encrypred = crypto.createHmac('sha1', this.salt).update(password).digest('hex');
      return encrypred;
    }
    catch (err) {
      return '';
    }
  }
};

userSchema.index({ username : 1 }, { unique : true });

mongoose.model('User', userSchema);


/**
 * Users
 */

var UserTableSchema = new Schema({
  user      : [{ type : Schema.Types.ObjectId, ref: 'User' }],
  subjects  : [{ type : Schema.Types.ObjectId, ref : 'Subject' }],
  removed   : [{ type : Schema.Types.ObjectId, ref : 'Subject' }],
  updatedAt : { type : Date, default : Date.now }
});

mongoose.model('UserTable', UserTableSchema);


/**
 * Buildings
 */

var BuildingSchema = new Schema({
  name        : { type : String, default : '' },
  description : { type : String, default : '' },
  createdAt   : { type : Date,   default : Date.now }
});

mongoose.model('Building', BuildingSchema);