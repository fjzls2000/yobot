var vm = new Vue({
    el: '#app',
    data: {
        progressData: [],
        members: [],
        group_name: null,
        reportDate: null,
        activeIndex: '3',
        multipleSelection: [],
        dropMemberVisible:false,
    },
    mounted() {
        var thisvue = this;
        axios.all([
            axios.post('../api/', {
                action: 'get_challenge',
                ts: null,
            }),
            axios.post('../api/', {
                action: 'get_member_list'
            }),
        ]).then(axios.spread(function (res, memres) {
            if (res.data.code != 0) {
                thisvue.$alert(res.data.message, '获取记录失败');
                return;
            }
            if (memres.data.code != 0) {
                thisvue.$alert(memres.data.message, '获取成员失败');
                return;
            }
            thisvue.members = memres.data.members;
            for (m of thisvue.members) {
                m.finished = 0;
                m.detail = [];
            }
            thisvue.refresh(res.data.challenges);
        })).catch(function (error) {
            thisvue.$alert(error, '获取数据失败');
        });
    },
    methods: {
        csummary: function (cha) {
            if (cha == undefined) {
                return '';
            }
            return '(' + cha.cycle + '-' + cha.boss_num + ') ' + cha.damage.toLocaleString();
        },
        cdetail: function (cha) {
            if (cha == undefined) {
                return '';
            }
            var nd = new Date();
            nd.setTime(cha.challenge_time * 1000);
            var detailstr = nd.toLocaleString() + '<br />';
            detailstr += cha.cycle + '周目' + cha.boss_num + '号boss<br />';
            detailstr += (cha.health_ramain + cha.damage).toLocaleString() + '→' + cha.health_ramain.toLocaleString();
            return detailstr;
        },
        arraySpanMethod: function ({ row, column, rowIndex, columnIndex }) {
            if (columnIndex >= 4) {
                if (columnIndex % 2 == 0) {
                    var detail = row.detail[columnIndex - 4];
                    if (detail != undefined && detail.health_ramain != 0) {
                        return [1, 2];
                    }
                } else {
                    var detail = row.detail[columnIndex - 5];
                    if (detail != undefined && detail.health_ramain != 0) {
                        return [0, 0];
                    }
                }
            }
        },
        report_day: function (event) {
            var thisvue = this;
            axios.post('../api/', {
                action: 'get_challenge',
                ts: (thisvue.reportDate.getTime() / 1000) + 43200,
            }).then(function (res) {
                if (res.data.code != 0) {
                    thisvue.$alert(res.data.message, '获取记录失败');
                } else {
                    thisvue.refresh(res.data.challenges);
                }
            }).catch(function (error) {
                thisvue.$alert(error, '获取记录失败');
            })
        },
        refresh: function (challenges) {
            this.progressData = [...this.members];
            var thisvue = this;
            var m = { qqid: -1 };
            for (c of challenges) {
                if (m.qqid != c.qqid) {
                    thisvue.update_member_info(m);
                    m = {
                        qqid: c.qqid,
                        finished: 0,
                        detail: [],
                    }
                }
                m.detail[2 * m.finished] = c;
                if (c.is_continue) {
                    m.finished += 0.5;
                } else {
                    if (c.health_ramain != 0) {
                        m.finished += 1;
                    } else {
                        m.finished += 0.5;
                    }
                }
            }
            thisvue.update_member_info(m);
        },
        update_member_info: function (m) {
            if (m.qqid == -1) {
                return
            }
            for (let index = 0; index < this.progressData.length; index++) {
                if (m.qqid == this.progressData[index].qqid) {
                    let nickname = this.progressData[index].nickname;
                    this.progressData[index] = m;
                    this.progressData[index].nickname = nickname;
                    return
                }
            }
            m.nickname = '（未加入）';
            this.progressData.push(m);
        },
        find_name: function (qqid) {
            for (m of this.members) {
                if (m.qqid == qqid) {
                    return m.nickname;
                }
            };
            return qqid;
        },
        handleTitleSelect(key, keyPath) {
            switch (key) {
                case '1':
                    window.location = '../';
                    break;
                case '2':
                    window.location = '../subscribers/';
                    break;
                case '3':
                    window.location = '../progress/';
                    break;
                case '4':
                    window.location = '../statistics/';
                    break;
                case '5':
                    window.location = `../my/`;
                    break;
            }
        },
        handleSelectionChange(val) {
            this.multipleSelection = val;
        },
        selectUnfinished(event) {
            this.progressData.forEach(row => {
                if (row.finished < 3) {
                    this.$refs.multipleTable.toggleRowSelection(row, true);
                } else {
                    this.$refs.multipleTable.toggleRowSelection(row, false);
                }
            });
        },
        sendRequest(action) {
            var memberlist = [];
            this.multipleSelection.forEach(row => {
                memberlist.push(row.qqid);
            });
            var thisvue = this;
            axios.post('../api/', {
                action: action,
                memberlist: memberlist,
            }).then(function (res) {
                if (res.data.code != 0) {
                    if (res.data.code == 11) {
                        res.data.message = '你的权限不足';
                    }
                    thisvue.$alert(res.data.message, '请求失败');
                } else {
                    thisvue.$notify({
                        title: '提醒',
                        message: res.data.notice,
                    });
                }
            }).catch(function (error) {
                thisvue.$alert(error, '请求失败');
            })
        },
    },
    delimiters: ['[[', ']]'],
})