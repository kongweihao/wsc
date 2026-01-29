(function () {
    // echart部分动画

    // 飞机logo地址
    // 实际地图
    $.ajax({
        url: 'json/getAllYigan.json',
        // json格式要求十分严格，结尾不能有多余的逗号，一定要用引号，甚至这一句注释都无法写在json文件中
        type: 'get',
        dataType: 'json',
        // async:false,
        success: function (res) {
            if (res.code == 200) {
                let linesData = []
                linesData.push(res.data);
                mainMap(linesData, 'chinaYigan');
            } else {
                alert('一干数据加载失败请联系管理员')
            }
        }
    })

    // map函数
    function mainMap(linesData, mapID) {
        // linesData获取到的json文件里面的所有数据
        let series = [];
        linesData.forEach(function (item, i) {
            series = series.concat(drawYigan(item.title, item.links, item.points));
        })
        console.log(series);
        // return
        // 基于准备好的dom，初始化echarts实例
        let myChart = echarts.init(document.getElementById(mapID));
        myChartMapGXZW = myChart;
        //地图样式显示
        myChart.setOption({
            tooltip: {
                trigger: 'item'
            },
            legend: {
                show: false,
                orient: 'vertical',
                bottom: 200,
                right: 500,
                data: [{
                    name: '全网状况',
                    textStyle: {
                        color: 'white' // 图例文字颜色
                    }
                },
                {
                    name: '三纵两横',
                    textStyle: {
                        color: 'white' // 图例文字颜色
                    },
                },
                {
                    name: '国际局点',
                    textStyle: {
                        color: 'ffa022' // 图例文字颜色
                    },
                },
                {
                    name: '陆缆出口局点',
                    textStyle: {
                        color: 'white' // 图例文字颜色
                    },
                },
                {
                    name: '海缆出口局点',
                    textStyle: {
                        color: 'white' // 图例文字颜色
                    },
                }
                ],
                textStyle: {
                    color: '#fff'
                },
                selectedMode: 'single',
                selected: {
                    '全网状况': true,
                    '三纵两横': false,
                    '国际局点': false,
                    '陆缆出口局点': false,
                    '海缆出口局点': false,
                },
                itemWidth: 50,
                itemHeight: 28,
                textStyle: {
                    fontSize: 20
                },
                inactiveColor: '#ccc' //图例关闭时的颜色。
            },
            geo: {
                map: 'china',
                // center:[95.8,38.3],
                // zoom:1,
                label: {
                    emphasis: {
                        show: true,
                        color: 'white',
                        fontSize: 20
                    },
                    normal: {
                        // show: true,
                        color: 'white',
                    },
                },
                //selectedMode : 'multiple',//选中模式，表示是否支持多个选中，默认关闭,默认值false，支持布尔值和字符串，字符串取值可选'single'表示单选，或者'multiple'表示多选。
                //roam:是否开启鼠标缩放和平移漫游。默认不开启。如果只想要开启缩放或者平移，可以设置成 'scale' 或者 'move'。设置成 true 为都开启
                roam: true,
                itemStyle: {
                    normal: {
                        areaColor: 'rgba(2,144,251,0)',
                        borderColor: 'rgba(2,222,228,1)',
                    },
                    emphasis: {
                        borderColor: 'rgba(100,149,237,1)',
                        areaColor: 'rgba(2,144,251,0.1)',
                    }
                },
            },
            tooltip: {
                trigger: 'item',
                formatter: function (params) {
                    let string = '';
                    let message = params.data.message;
                    for (let key in message) {
                        string = string + key + '：' + message[key] + '</br>';
                    }
                    return string;
                }
            },
            series: series,
        })
    }

    function drawYigan(name, links, points) {
        // links : 航线数据  ; points ：地点名称与坐标; resIDArr：构造通过resID索引的对象，减少下方循环计算量
        let seriesArr = [];
        let resIDArr = {}
        points.map(function (dataItem) {
            resIDArr[dataItem.resID] = dataItem
        })
        // 画线
        links.forEach(function (dataItem, i) {
            seriesArr.push(
                {
                    //动画线
                    name: name,
                    type: 'lines',
                    zlevel: 1,
                    effect: {
                        show: true, //是否显示动画，以表现光缆的输出方向
                        period: 1,
                        delay: 1,
                        trailLength: 1, //动画运动时的尾巴长度
                        color: '#02DEE4',
                        symbolSize: 2
                    },
                    lineStyle: { //动画运动的轨迹样式
                        normal: {
                            color: 'yellow',
                            width: 2, //这里表示不显示运动轨迹
                            curveness: 0.2//边的曲度，支持从 0 到 1 的值，值越大曲度越大。如果polyline（下面）值为true，即支持多段线，曲度不生效
                        }
                    },
                    // polyline: true, //是否是多段线。默认为 false，只能用于绘制只有两个端点的线段;如果该配置项为 true，则可以在 data.coords 中设置多于 2 个的顶点用来绘制多段线，在绘制路线轨迹的时候比较有用
                    data: [{
                        coords: [[resIDArr[dataItem.startPointID].longitude, resIDArr[dataItem.startPointID].latitude], [resIDArr[dataItem.endPointID].longitude, resIDArr[dataItem.endPointID].latitude]],
                        fromName: { name: resIDArr[dataItem.startPointID].rmsName, value: 10 },
                        toName: { name: resIDArr[dataItem.endPointID].rmsName, value: 10 },
                    }],
                    // [
                    //     {
                    //         coords: [[121.4648, 31.2891], [123, 34], [126, 35]],
                    //         fromName: {
                    //             name: "上海"
                    //         },
                    //         toName: {
                    //             name: "NCP海缆"
                    //         }
                    //     }

                    // ], //由于convertData需要传入一个二维数组，此处item只是一个一位数组，所以这里用[]将item构造成一个二维数组
                },

            );
        })
        // // 画点
        // seriesArr.push(
        //     {
        //         //带有涟漪特效动画的散点（气泡）图。利用动画特效可以将某些想要突出的数据进行视觉突出。
        //         name: name,
        //         type: 'effectScatter',
        //         coordinateSystem: 'geo',
        //         zlevel: 2,
        //         rippleEffect: {
        //             brushType: 'stroke'
        //         },
        //         symbolSize: function (val) {
        //             return val[2];
        //         },
        //         itemStyle: {
        //             normal: {
        //                 color: 'yellow',
        //             }
        //         },
        //         data: points.map(function (dataItem) { //此处目的是为了构造一个多维数组,数组每一项是一个json对象
        //             // console.log(geoCoordMap[dataItem.name].concat([dataItem.value]))
        //             return {
        //                 name: dataItem.rmsName,
        //                 value: [dataItem.longitude, dataItem.latitude, 2],
        //                 message: dataItem.province,
        //                 label: {
        //                     normal: {
        //                         show: false, // 不能直接 dataItem.nameIsShow || true，因为当dataItem.nameIsShow = false时，反而给show字段赋值true了
        //                         position: 'top',
        //                         formatter: '{b}',
        //                         fontSize: 14, // 不能直接 dataItem.fontSize || 14，因为当dataItem.fontSize = 0时，反而给fontSize字段赋值14了
        //                         color: 'white'
        //                         // rotate:90,//文字旋转90度
        //                     }
        //                 },
        //                 // symbol:'pin'
        //             };
        //         })
        //     }
        // )
        return seriesArr;
    }
})()