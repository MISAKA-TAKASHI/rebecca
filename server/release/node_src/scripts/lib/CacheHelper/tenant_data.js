(function() {
    var GlobalSNSManagerDbConnector = require('../DbHelper/global_sns_manager_db_connector');
    var Utils = require('../../utils');

    /**
    * tenant_store モデルクラス
    */
    function TenantData() {
        // redis でのデータ型の名称
        this.REDIS_DATA_TYPE = 'hash';
        // redis でのキー名
        this.REDIS_KEY_NAME = 'tenant_store';

        this.setFieldName(null);
        this._tenantUuid = null;
        this._tenantConf = null;
    }

    // 定数定義
    // 削除フラグ(0:通常、1:削除済、2:休止 )
    TenantData.DELETE_FLG_OFF = 0;
    TenantData.DELETE_FLG_ON = 1;
    TenantData.DELETE_FLG_SUSPEND = 2;

    /**
    * CacheCheff で使用する場合の生成メソッド
    * @param {string} tenantName フィールド名であるテナント名
    * @return {object} TenantData 生成したTenantDataを返却
    */
    TenantData.createAsOrder = function(tenantName) {
        if (tenantName == null || typeof tenantName != 'string' || tenantName == '') {
            return null;
        }
        var _tenantData = new TenantData();

        _tenantData.setFieldName(tenantName);

        return _tenantData;
    }

    var _proto = TenantData.prototype;

    // フィールド名
    _proto.getFieldName = function() {
        return this._REDIS_FIELD_NAME;
    }
    _proto.setFieldName = function(fieldName) {
        this._REDIS_FIELD_NAME = fieldName;
    }

    // 保持データ
    _proto.getData = function() {
        /* EXAMPLE
        data = '{ "tenant_uuid": "aa944196-e5d5-11e5-84b4-000c29690167" }';
        */
        var _data = {};
        _data['tenant_uuid'] = this.getTenantUuid();
        _data['tenant_conf'] = this.getTenantConf();
        return JSON.stringify(_data);
    }

    // テナントUUID
    _proto.getTenantUuid = function() {
        return this._tenantUuid;
    }
    _proto.setTenantUuid = function(tenantUuid) {
        this._tenantUuid = tenantUuid;
    }

    // テナント設定
    _proto.getTenantConf = function() {
        return this._tenantConf;
    }
    _proto.setTenantConf = function(tenantConf) {
        this._tenantConf = tenantConf;
    }

    // テナント名
    _proto.getTenantName = function() {
        return this.getFieldName();
    }
    _proto.setTenantName = function(tenantName) {
        this.setFieldName(tenantName);
    }

    /**
    * Cach(redis)データからデータモデルインスタンスを生成するメソッド
    * @param {string} tenantName フィールド名であるテナント名
    * @param {string} data Redisから取得したJSON形式のデータ
    *                 ex) '{ "tenant_uuid": "aa944196-e5d5-11e5-84b4-000c29690167" }'
    * @return {object} TenantData 生成したTenantDataを返却
    */
    _proto.createDish = function(tenantName, data) {
        if (tenantName == null || typeof tenantName != 'string' || tenantName == '') {
            return null;
        }
        if (data == null || typeof data != 'string' || data == '') {
            return null;
        }

        var _tenantData = new TenantData();
        _tenantData.setFieldName(tenantName);

        var _tempJson = JSON.parse( data );
        var _t_tenant_uuid = _tempJson.tenant_uuid;
        if (_t_tenant_uuid == null || typeof _t_tenant_uuid != 'string' || _t_tenant_uuid == '') {
            return null;
        }
        var _t_tenant_conf = _tempJson.tenant_conf;
        if (_t_tenant_conf == null || typeof _t_tenant_conf != 'object') {
            _t_tenant_conf = {};
        }
        _tenantData.setTenantUuid(_t_tenant_uuid);
        _tenantData.setTenantConf(_t_tenant_conf);

        return _tenantData;
    }

    /**
    * DBデータからデータモデルインスタンスを生成するメソッド
    * @param {string} tenantName フィールド名であるテナント名
    * @param {object} datas DBから取得したデータ配列
    * @return {object} TenantData 生成したTenantDataを返却
    */
    _proto.createDishByDBSource = function(tenantName, datas) {
        if (tenantName == null || typeof tenantName != 'string' || tenantName == '') {
            return null;
        }
        if (datas == null || typeof datas != 'object' || datas.length != 1) {
            return null;
        }

        var _tenantData = new TenantData();
        _tenantData.setFieldName(tenantName);

        var _t_tenant_uuid = Utils.getChildObject(datas[0], 'uuid');
        if (_t_tenant_uuid == null || typeof _t_tenant_uuid != 'string' || _t_tenant_uuid == '') {
            return null;
        }
        var _t_tenant_conf = {};
        if ('conf' in datas[0] && typeof datas[0].conf == 'object') {
            _t_tenant_conf = datas[0].conf;
        }

        _tenantData.setTenantUuid(_t_tenant_uuid);
        _tenantData.setTenantConf(_t_tenant_conf);

        return _tenantData;
    }

    /**
    * Cach(redis) にデータがない場合にDB(globalsns_manager)に発行するSQL
    * @return {string} SQL文
    */
    _proto.getSql = function() {
        var _self = this;
        var _sql = '';
        _sql += ' SELECT * FROM ' + _self.REDIS_KEY_NAME;
        _sql += ' WHERE name = ' + GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(_self.getFieldName());
        _sql += ' AND delete_flg = ' + TenantData.DELETE_FLG_OFF;
        return _sql;
    }

    exports.createAsOrder = TenantData.createAsOrder;
    exports.REDIS_DATA_TYPE = TenantData.REDIS_DATA_TYPE;
    exports.REDIS_KEY_NAME = TenantData.REDIS_KEY_NAME;
    exports.DELETE_FLG_OFF = TenantData.DELETE_FLG_OFF;
    exports.DELETE_FLG_ON = TenantData.DELETE_FLG_ON;
    exports.DELETE_FLG_SUSPEND = TenantData.DELETE_FLG_SUSPEND;
})();