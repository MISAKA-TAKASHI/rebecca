var UserAccountManager = require('./user_account_manager');
var UserAccountData = require('../model/user_account_data');
var SynchronousBridgeNodeXmpp = require('./synchronous_bridge_node_xmpp');
var Conf = require('./conf');
var ServerLog = require('./server_log');
var XmppUtils = require('./xmpp_utils');

var _conf = Conf.getInstance();
var _log = ServerLog.getInstance();

/*
 * アカウントデータに関するUtilクラス
 */
function UserAccountUtils() {
}

var _proto = UserAccountUtils.prototype;
/*
 * ログインアカウントからユーザアカウント情報を取得
 */
UserAccountUtils.getUserDataByTenantLoginAccount = function(tenantUuid, loginAccount,
        onGetUserAccountDataCallBack) {
    if (tenantUuid == null || typeof tenantUuid != 'string') {
        return false;
    }
    if (loginAccount == null || typeof loginAccount != 'string') {
        return false;
    }
    if (onGetUserAccountDataCallBack == null
            || typeof onGetUserAccountDataCallBack != 'function') {
        return false;
    }
    var _userAccountManager = UserAccountManager.getInstance();
    return _userAccountManager.getUserAccountDataByTenantLoginAccount(tenantUuid, loginAccount,
            _onResultCallBack);

    function _onResultCallBack(err, result) {
        var _ret = null;
        /* The value assigned to _ret here is unused.
        if (result) {
            _ret = result;
        } */
        onGetUserAccountDataCallBack(result);
    }
};
/*
 * jidからユーザアカウント情報を取得
 */
UserAccountUtils.getLoginAccountListByJidList = function(jidList,
        onGetUserAccountDataCallBack) {
    if (jidList == null || !(jidList instanceof Array)) {
        return false;
    }
    if (onGetUserAccountDataCallBack == null
            || typeof onGetUserAccountDataCallBack != 'function') {
        return false;
    }
    var _userAccountManager = UserAccountManager.getInstance();
    var _jidListCount = jidList.length;
    var _searchList = new Array();
    for ( var _j = 0; _j < _jidListCount; _j++) {
        var _searchData = {};
        var _openfireAccount = jidList[_j].split('@')[0];
        var _xmppServerName = jidList[_j].split('@')[1];
        _searchData.openfire_account = _openfireAccount;
        _searchData.xmpp_server_name = _xmppServerName;
        _searchList[_j] = _searchData;
    }
    return _userAccountManager
            .getUserAccountDataListByOFAccountAndXmppServerName(_searchList,
                    _onResultCallBack);

    function _onResultCallBack(err, userAccountDataList) {
        if (err) {
            onGetUserAccountDataCallBack(null);
            return;
        }
        var _ret = null;
        if (userAccountDataList) {
            _ret = {};
            var _count = userAccountDataList.length;
            for ( var _i = 0; _i < _count; _i++) {
                var _userAccountData = userAccountDataList[_i];
                var _loginAccount = _userAccountData.getLoginAccount();
                var _openfireAccount = _userAccountData.getOpenfireAccount();
                var _xmppServerName = _userAccountData.getXmppServerName();
                var _jid = _openfireAccount + '@' + _xmppServerName;
                _ret[_jid] = _loginAccount;
            }
        }
        onGetUserAccountDataCallBack(_ret);
    }
};
/*
 * ログインアカウントからユーザアカウント情報を取得(アクティブユーザ)
 */
UserAccountUtils.getActiveUserDataByTenantLoginAccount = function(tenantUuid, loginAccount,
        onGetUserAccountDataCallBack) {
    if (tenantUuid == null || typeof tenantUuid != 'string') {
        return false;
    }
    if (loginAccount == null || typeof loginAccount != 'string') {
        return false;
    }
    if (onGetUserAccountDataCallBack == null
            || typeof onGetUserAccountDataCallBack != 'function') {
        return false;
    }
    return UserAccountUtils.getUserDataByTenantLoginAccount(tenantUuid, loginAccount,
            _onResultCallBack);

    function _onResultCallBack(userAccountData) {
        var _ret = null;
        if (!userAccountData) {
            onGetUserAccountDataCallBack(_ret);
            return;
        }
        var _deleteFlg = userAccountData.getDeleteFlg();
        if (_deleteFlg == UserAccountData.DELETE_FLG_OFF) {
            _ret = userAccountData;
        }
        onGetUserAccountDataCallBack(_ret);
    }
};
/**
* ユーザデータ一覧件数取得
* @param {SessionData} sessionData セッションデータ
* @param {string} tenantId テナントID 省略可 nullの場合は省略とする
* @param {Array} except 取得するユーザ一覧に含めないユーザ名(Openfireアカウント名)の配列
* @param {Boolean} onSelectDelUsrFlg 削除済みユーザを含むかどうかのフラグ true:削除ユーザ含む、false:削除ユーザ含まない
* @param {function} onGetUserListCountCallBack 実行結果後のコールバック
* @returns {boolean} true : 処理成功 / false : 処理失敗
*/
UserAccountUtils.getUserListCountForAdmintool = function(
        sessionData, tenantId, except, onSelectDelUsrFlg, onGetUserListCountCallBack) {
    if (sessionData == null || typeof sessionData != 'object') {
        _log.connectionLog(3, 'UserAccountUtils#getUserListCountForAdmintool sessionData is invalid');
        return false;
    }
    if (except == null || typeof except != 'object') {
        _log.connectionLog(3, 'getUserListCountForAdmintool :: except is invalid');
        return false;
    }
    if (onGetUserListCountCallBack == null
            || typeof onGetUserListCountCallBack != 'function') {
        _log.connectionLog(3, 'UserAccountUtils#getUserListCountForAdmintool onGetUserListCountCallBack is invalid');
        return false;
    }
    var _userAccountManager = UserAccountManager.getInstance();
    return _userAccountManager.getUserListCountForAdmintool(
            sessionData, tenantId, except, onSelectDelUsrFlg, _onResultCallBack);

    function _onResultCallBack(err, userListCount, userListCount_NotDelete) {
        if (err) {
            onGetUserListCallBack(null);
            return;
        }
        onGetUserListCountCallBack(userListCount, userListCount_NotDelete);
    }
};
/**
 * ユーザデータ一覧取得
     * @param {SessionData} sessionData セッションデータ
     * @param {string} tenantId テナントID 省略可 nullの場合は省略とする
     * @param {Array} except 取得するユーザ一覧に含めないユーザ名(Openfireアカウント名)の配列
     * @param {number} start 取得開始件数（何件目～）
     * @param {number} count 取得件数
     * @param {Boolean} onSelectDelUsrFlg 削除済みユーザを含むかどうかのフラグ true:削除ユーザ含む、false:削除ユーザ含まない
     * @param {function} onGetUserListCallBack 実行結果後のコールバック
     * @returns {boolean} true : 処理成功 / false : 処理失敗
 */
UserAccountUtils.getUserListForAdmintool = function(
        sessionData, tenantId, except, start, count, onSelectDelUsrFlg, onGetUserListCallBack) {
    if (sessionData == null || typeof sessionData != 'object') {
        _log.connectionLog(3, 'UserAccountUtils#getUserListForAdmintool sessionData is invalid');
        return false;
    }
    if (except == null || typeof except != 'object') {
        _log.connectionLog(3, 'UserAccountUtils#getUserListForAdmintool :: except is invalid');
        return false;
    }
    if (start == null || typeof start != 'number') {
        _log.connectionLog(3, 'UserAccountUtils#getUserListForAdmintool start is invalid');
        return false;
    }
    if (count == null || typeof count != 'number') {
        _log.connectionLog(3, 'UserAccountUtils#getUserListForAdmintool count is invalid');
        return false;
    }
    if (onGetUserListCallBack == null
            || typeof onGetUserListCallBack != 'function') {
        _log.connectionLog(3, 'UserAccountUtils#getUserListForAdmintool onGetUserListCallBack is invalid');
        return false;
    }
    var _userAccountManager = UserAccountManager.getInstance();
    return _userAccountManager.getUserListForAdmintool(
            sessionData, tenantId, except, start, count, onSelectDelUsrFlg, _onResultCallBack);

    function _onResultCallBack(err, userList) {
        if (err) {
            onGetUserListCallBack(null);
            return;
        }
        var _ret = null;
        onGetUserListCallBack(userList);
    }
};
/**
 * Openfireのアカウントを生成(※現在未使用)
 * @param {String} loginAccount cubeeのログインアカウント
 * @param {String} xmppServerName XMPPサーバ名
 * @param {function} onCreateOpenfireAccountCallBack コールバック関数
 * @returns {boolean} 処理開始成功 : true / 処理失敗 : false
 */
UserAccountUtils.createUniqueOpenfireAccount = function(loginAccount, xmppServerName, onCreateOpenfireAccountCallBack) {
    if(loginAccount == null || typeof loginAccount != 'string' || loginAccount == '') {
        _log.connectionLog(3, 'UserAccountUtils#createUniqueOpenfireAccount loginAccount is invalid');
        return false;
    }
    if(xmppServerName == null || typeof xmppServerName != 'string' || xmppServerName == '') {
        _log.connectionLog(3, 'UserAccountUtils#createUniqueOpenfireAccount xmppServerName is invalid');
        return false;
    }
    if(onCreateOpenfireAccountCallBack == null || typeof onCreateOpenfireAccountCallBack != 'function') {
        _log.connectionLog(3, 'UserAccountUtils#createUniqueOpenfireAccount onCreateOpenfireAccountCallBack is invalid');
        return false;
    }
    var _userAccountManager = UserAccountManager.getInstance();
    return _userAccountManager.createUniqueOpenfireAccount(loginAccount, xmppServerName, onCreateOpenfireAccountCallBack);
};
/**
 * ユーザ登録
 *
 * @param {SessionData} sessionData セッションデータ
 * @param {PersonData} personData 登録する人情報
 * @param {PersonData} password パスワード
 * @param {RegisteredContactData} registeredContactData
 * @param {function} onRegUserCallBack 実行結果後のコールバック
 * @returns {boolean} true : 処理成功 / false : 処理失敗
 */
UserAccountUtils.create = function(sessionData, personData, password,
        registeredContactData, onRegUserCallBack) {
    if (sessionData == null || typeof sessionData != 'object') {
        _log.connectionLog(3, 'UserAccountUtils#create sessionData is invalid');
        return false;
    }
    if (personData == null || typeof personData != 'object') {
        _log.connectionLog(3, 'UserAccountUtils#create personData is invalid');
        return false;
    }
    if (password == null || typeof password != 'string') {
        _log.connectionLog(3, 'UserAccountUtils#create password is invalid');
        return false;
    }
    if (registeredContactData == null
            || typeof registeredContactData != 'object') {
        _log.connectionLog(3,
                'UserAccountUtils#create registeredContactData is invalid');
        return false;
    }
    if (onRegUserCallBack == null || typeof onRegUserCallBack != 'function') {
        _log.connectionLog(3,
                'UserAccountUtils#create onRegUserCallBack is invalid');
        return false;
    }
    var _userAccountManager = UserAccountManager.getInstance();
    return _userAccountManager.create(sessionData, personData, password,
            registeredContactData, onRegUserCallBack);
};

/**
 * ユーザのパスワードを更新する（adminj権限ユーザ用）
 * @param {string} accessToken アクセストークン
 * @param {string} loginAccount 登録するユーザ情報
 * @param {string} password 登録するユーザのパスワード
 * @param {function} onUpdateUserPasswordCallback コールバック関数
 * @returns {Boolean} 更新を開始できた場合はtrue、更新に失敗した場合はfalse
 */
UserAccountUtils.updateUserPassword = function(sessionData, loginAccount, password,
        onUpdateUserPasswordCallback) {
    if (sessionData == null || typeof sessionData != 'object') {
        _log.connectionLog(3, 'UserAccountUtils#updateUserPassword sessionData is invalid');
        return false;
    }
    if (loginAccount == null || typeof loginAccount != 'string') {
        _log.connectionLog(3, 'UserAccountUtils#updateUserPassword loginAccount is invalid');
        return false;
    }
    if (password == null || typeof password != 'string') {
        _log.connectionLog(3, 'UserAccountUtils#updateUserPassword password is invalid');
        return false;
    }
    if (onUpdateUserPasswordCallback == null || typeof onUpdateUserPasswordCallback != 'function') {
        _log.connectionLog(3,
                'UserAccountUtils#updateUserPassword onUpdateUserPasswordCallback is invalid');
        return false;
    }
    var _tenantUuid = sessionData.getTenantUuid();
    var _xmppServerName = sessionData.getXmppServerName();
    return UserAccountUtils.getUserDataByTenantLoginAccount(_tenantUuid, loginAccount, _onGetUserAccountDataCallBack);

    function _onGetUserAccountDataCallBack(userAccountData){
        var _result = false;
        var _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_INNER;
        if(userAccountData == null){
            _log.connectionLog(4, 'UserAccountUtils#_onGetUserAccountDataCallBack userAccountData is null');
            onUpdateUserPasswordCallback(_result, _reason);
            return;
        }
        var _xsConn = sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(4, 'UserAccountUtils#_onGetUserAccountDataCallBack _xsConn is null');
            onUpdateUserPasswordCallback(_result, _reason);
            return;
        }
        var _openfireAccount = userAccountData.getOpenfireAccount();
        var _fromJid = sessionData.getJid();
        //ここでXmppを取得しないと、Synchronousから実行したときにundefindとなる
        var _xmpp = require('./xmpp').Xmpp;
        var _xmppUpdateUserPassword = XmppUtils.checkCreateXmppData(_xsConn, function() {
            return _xmpp.createUpdateUserPasswordXmpp(_xmppServerName, _fromJid, _openfireAccount, password);
        });
       if (_xmppUpdateUserPassword == null) {
            _log.connectionLog(4, 'UserAccountUtils#_onGetUserAccountDataCallBack _xmppUpdateUserPassword is null');
            onUpdateUserPasswordCallback(_result, _reason);
            return;
        }
        var _xmppStr = _xmppUpdateUserPassword[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(4, 'UserAccountUtils#_onGetUserAccountDataCallBack _xmppUpdateUserPassword[0] is invalid');
            onUpdateUserPasswordCallback(_result, _reason);
            return;
        }
        var _id = _xmppUpdateUserPassword[1];
        sessionData.setCallback(_id, _onUpdateUserPasswordCallBack);
        _xsConn.send(_xmppStr);
    }

    function _onUpdateUserPasswordCallBack(xmlRootElem){
        var _result = false;
        var _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_XMPP_SERVER;
        var _iqTypeAttr = xmlRootElem.attr('type');
        if(_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
            _result = true;
            _reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_NO;
        }
        onUpdateUserPasswordCallback(_result, _reason);
    }
};


/**
 * ユーザデータ一括登録
 * @param {SessionData} sessionData セッションデータ
 * @param {Array} createUserMap 登録するユーザ(createUserData)のマップ
 *                  構造
 *                    {
 *                       【登録するユーザアカウント】 : {
 *                             personData : PersonDataオブジェクト
 *                             password : パスワード
 *                             registeredContactData : RegisteredContactDataオブジェクト
 *                        },
 *                        ※2件目
 *                    }
 * @param {function} onExecBatchRegistration 実行結果後のコールバック
 * @returns {boolean} true : 処理成功 / false : 処理失敗
 */
UserAccountUtils.execBatchRegistration = function(sessionData,createUserMap,onExecBatchRegistration) {
    var _userAccountManager = UserAccountManager.getInstance();
    return _userAccountManager.execBatchRegistration(sessionData,createUserMap,onExecBatchRegistration);
};
/**
 * ユーザアカウントのステータス更新
 * @param {string} tenantUuid テナントUUID
 * @param {string} loginAccount ログインアカウント
 * @param {number} accountStatus  ステータス(0:アクティブ 1:削除 2:休止)
 * @param {function} onUpdateUserAccountStatusCallBack 実行結果後のコールバック
 * @returns {boolean} true : 処理成功 / false : 処理失敗
 */
UserAccountUtils.updateUserAccountStatus = function(tenantUuid,loginAccount,accountStatus,onUpdateUserAccountStatusCallBack) {
    var _userAccountManager = UserAccountManager.getInstance();
    return _userAccountManager.updateUserAccountStatus(tenantUuid,loginAccount,accountStatus,onUpdateUserAccountStatusCallBack);
};

/**
 * ユーザアカウントのメールアドレス更新
 * @param {string} tenantUuid テナントUUID
 * @param {string} loginAccount ログインアカウント
 * @param {string} mailAddress メールアドレス
 * @param {function} onUpdateUserAccountMailAddressCallBack 実行結果後のコールバック
 * @returns {boolean} true : 処理成功 / false : 処理失敗
 */
UserAccountUtils.updateUserAccountMailAddress = function(tenantUuid, loginAccount, mailAddress, onUpdateUserAccountMailAddressCallBack) {
    var _userAccountManager = UserAccountManager.getInstance();
    return _userAccountManager.updateUserAccountMailAddress(tenantUuid, loginAccount, mailAddress, onUpdateUserAccountMailAddressCallBack);
};

exports.getUserDataByTenantLoginAccount = UserAccountUtils.getUserDataByTenantLoginAccount;
exports.getLoginAccountListByJidList = UserAccountUtils.getLoginAccountListByJidList;
exports.getActiveUserDataByTenantLoginAccount = UserAccountUtils.getActiveUserDataByTenantLoginAccount;
exports.createOpenfireAccount = UserAccountUtils.createOpenfireAccount;
exports.create = UserAccountUtils.create;
exports.updateUserPassword = UserAccountUtils.updateUserPassword;
exports.getUserListCountForAdmintool = UserAccountUtils.getUserListCountForAdmintool;
exports.getUserListForAdmintool = UserAccountUtils.getUserListForAdmintool;
exports.createUniqueOpenfireAccount = UserAccountUtils.createUniqueOpenfireAccount;
exports.execBatchRegistration = UserAccountUtils.execBatchRegistration;
exports.updateUserAccountStatus = UserAccountUtils.updateUserAccountStatus;
exports.updateUserAccountMailAddress = UserAccountUtils.updateUserAccountMailAddress;
