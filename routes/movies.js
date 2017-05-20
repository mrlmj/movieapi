var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

//创建数据库model
var Schema = mongoose.Schema;
var movieSchema = new Schema({
    title: String,
    time: Number,
    update_time: String,
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
    "all": "全部分类",
    "movie": "电影",
    "teleplay": "电视剧",
    "carton": "动漫",
    "vr": "VR视频"
};

var category_map = {
    "all": "全部类型",
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

var year_map = {
    "all": "不限",
    "y2017": "2017",
    "y2016": "2016",
    "y2015": "2015",
    "y2014": "2014",
    "y2013": "2013",
    "y2012": "2012",
    "old": "更早"
};

var country_map = {
    "all": "全部地区",
    "china" : "大陆",
    "hk" : "香港",
    "taiwan" : "台湾",
    "japan" : "日本",
    "korean" : "韩国",
    "american" : "美国",
    "thailand" : "泰国",
    "india" : "印度"
};

//获取电影的类型
router.route("/movies/type").get(function (req, res) {
    res.send(type_map);
});

//获取电影的分类
router.route("/movies/category").get(function (req, res) {
    res.send(category_map);
});

//获取电影的年代
router.route("/movies/time").get(function (req, res) {
    res.send(year_map);
});

//获取电影的地区
router.route("/movies/country").get(function (req, res) {
    res.send(country_map);
});

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
        formatMovieItem(movie);
        res.send(error || movie);

    });
});

//搜索
router.route("/movies/search/:name/:limit/:page").get(function (req, res) {
    getPageQuery(req).find({$or: [{title: new RegExp(req.params.name)}, {actors: new RegExp(req.params.name)}]}, function (error, movies) {
        res.send(error || movies);
    })
});

//查询全部影片列表
router.route("/movies/:limit/:page").get(function (req, res) {
    var query = getPageQuery(req);
    query.exec(function (error, movies) {
        formatMovieItem(movies);
        res.send(error || movies);
    });
});

//查询指定类型的影片列表（电影 or 电视剧 or 动漫）
router.route("/movies/:type/:limit/:page").get(function (req, res) {
    getTypeQuery(getPageQuery(req), req)
        .exec(function (error, movies) {
            formatMovieItem(movies);
            res.send(error || movies);
        });
});

//查询指定分类的影片列表(动作 or 爱情)
router.route("/movies/:type/:category/:limit/:page").get(function (req, res) {
    getCategoryQuery(getPageQuery(req), req)
        .exec(function (error, movies) {
            formatMovieItem(movies);
            res.send(error || movies);
        });
});

//查询指定年份影片列表
router.route("/movies/:type/:category/:year/:limit/:page").get(function (req, res) {
    getYearQuery(getCategoryQuery(getPageQuery(req), req), req)
        .exec(function (error, movies) {
            formatMovieItem(movies);
            res.send(error || movies);
        });
});

//查询指定国家影片列表
router.route("/movies/:type/:category/:year/:country/:limit/:page").get(function (req, res) {
    getCountryQuery(getYearQuery(getCategoryQuery(getPageQuery(req), req), req), req)
        .exec(function (error, movies) {
            formatMovieItem(movies);
            res.send(error || movies);
        });
});


function getPageQuery(req) {
    var rows = parseInt(req.params.limit);
    var page = parseInt(req.params.page);
    console.log("page:" + page + ",rows:" + rows);
    return Movie.find({})
        .sort("-update_time")
        .select("time update_time title countries types image_url introduce crawl_url")
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
        typeQueryCondition.push(category_map[category]);
    }
    if (typeQueryCondition.length > 0) {
        return query.where("types").all(typeQueryCondition);
    } else {
        return query;
    }

}

function getYearQuery(query, req) {
    var year = req.params.year;
    if (year == "all") {
        return query;
    } else if (year == "old") {
        return query.where("time").lt(2012);
    } else {
        return query.where("time").equals(parseInt(year.substring(1)));
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

function formatMovieItem(movies) {
    if (movies instanceof Array) {
        movies.map(function (movie) {
            var formatDate = new Date(movie.update_time);
            movie.update_time = formatDate.getFullYear() + "-" + (formatDate.getMonth() + 1) + "-" + formatDate.getDate();
        });
    } else if (movies != null) {
        var formatDate = new Date(movies.update_time);
        movies.update_time = formatDate.getFullYear() + "-" + (formatDate.getMonth() + 1) + "-" + formatDate.getDate();
    }
}

module.exports = router;
