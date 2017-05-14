var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

//创建数据库model
var Schema = mongoose.Schema;
var movieSchema = new Schema({
    title: String,
    time: String,
    update_time: Date,
    introduce: [String],
    image_url: String,
    crawl_url: String,
    types: [String],
    counties: [String],
    languages: [String],
    actors: [String],
    links: Array

});
var Movie = mongoose.model("Movie", movieSchema);

var type_map = {
    "movie": "电影",
    "teleplay": "电视剧",
    "carton": "动漫",
    "vr": "VR视频",
    "action": "动作",
    "science": "科幻",
    "comedy": "喜剧",
    "love": "爱情",
    "story": "剧情",
    "fantastic": "奇幻",
    "animation": "动画",
    "panic": "惊悚",
    "terror": "恐怖",
    "suspense": "悬疑",
    "crime": "犯罪",
    "war": "战争",
    "risk": "冒险",
    "west": "西部",
    "disaster": "灾难",
    "swordsmen": "武侠",
    "costume": "古装",
    "spy": "谍战",
    "biographical": "传记",
    "history": "历史",
    "record": "记录",
    "homo": "同性",
    "music": "音乐",
    "dancing": "歌舞",
    "youth": "青春",
    "family": "家庭",
    "child": "儿童",
    "school": "校园",
    "encourage": "励志",
    "sport": "运动",
    "physic": "体育",
    "short": "短片",
    "reality": "真人秀",
    "black": "黑色电影",
    "talk": "脱口秀"
};

var country_map = {
    "china" : "大陆",
    "hk" : "香港",
    "taiwan" : "台湾",
    "japan" : "日本",
    "korean" : "韩国",
    "american" : "美国",
    "thailand" : "泰国",
    "india" : "印度"
};

//调试用
router.route("/movies/debug").get(function (req, res) {
        Movie.findOne(function (error, movie) {
            if (error) {
                res.send("read db error!");
            } else {
                res.send(movie);
            }
        });
    });

//获取某一部影片的详细信息
router.route("/movies/detail/:id").get(function (req, res) {
    var movieId = req.params.id;
    Movie.findOne({_id: movieId}, function (error, movie) {
        res.send(error || movie);
    });
});

//获取电影的类型
router.route("/movies/category").get(function (req, res) {
    var typeArray = [];
    for (var type in type_map) {
        typeArray.push(type);
    }
    res.send(typeArray);
});

//查询全部影片列表
router.route("/movies/:limit/:page").get(function (req, res) {
    var query = getPageQuery(req);
    query.exec(function (error, movies) {
        res.send(error || movies);
    });
});

//查询指定类型的影片列表（电影 or 电视剧 or 动漫）
router.route("/movies/:type/:limit/:page").get(function (req, res) {
    getTypeQuery(getPageQuery(req), req)
        .exec(function (error, movies) {
            res.send(error || movies);
        });
});

//查询指定分类的影片列表(动作 or 爱情)
router.route("/movies/:type/:category/:limit/:page").get(function (req, res) {
    getCategoryQuery(getPageQuery(req), req)
        .exec(function (error, movies) {
            res.send(error || movies);
        });
});

//查询指定年份影片列表
router.route("/movies/:type/:category/:year/:limit/:page").get(function (req, res) {
    getYearQuery(getCategoryQuery(getPageQuery(req), req), req)
        .exec(function (error, movies) {
            res.send(error || movies);
        });
});

//查询指定国家影片列表
router.route("/movies/:type/:category/:year/:country/:limit/:page").get(function (req, res) {
    getCountryQuery(getYearQuery(getCategoryQuery(getPageQuery(req), req), req), req)
        .exec(function (error, movies) {
            res.send(error || movies);
        });
});


function getPageQuery(req) {
    var rows = parseInt(req.params.limit);
    var page = parseInt(req.params.page);
    console.log("page:" + page + ",rows:" + rows);
    return Movie.find({})
        .sort("-update_time")
        .select("time update_time title countries types image_url")
        .skip((page - 1) * rows)
        .limit(rows);
}

function getTypeQuery(query, req) {
    var type = req.params.type;
    var typeQueryCondition = [];
    if (type != "all") {
        typeQueryCondition.push(type_map[type]);
    }
    if (typeQueryCondition.length > 0) {
        return query.where("types").all(typeQueryCondition);
    } else {
        return query;
    }
}

function getCategoryQuery(query, req) {
    var type = req.params.type;
    var category = req.params.category;
    var typeQueryCondition = [];
    if (type != "all") {
        typeQueryCondition.push(type_map[type]);
    }
    if (category != "all") {
        typeQueryCondition.push(type_map[category]);
    }
    if (typeQueryCondition.length > 0) {
        return query.where("types").all(typeQueryCondition);
    } else {
        return query;
    }

}

function getYearQuery(query, req) {
    var year = req.params.year;
    if (year != "all") {
        return query.where("time").equals(year);
    } else {
        return query;
    }
}

function getCountryQuery(query, req) {
    var country = req.params.country;
    var countryQueryCondition = [];
    if (country != "all") {
        countryQueryCondition.push(country_map[country]);
    }
    if (countryQueryCondition.length > 0) {
        return query.where("countries").all(countryQueryCondition);
    } else {
        return query;
    }
}

module.exports = router;
