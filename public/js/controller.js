
const environment = 'http://localhost:3000'
//const environment = 'https://green-guard.herokuapp.com'
// var init = true






/*****************************************************************************************************************************/
var perimeter = []
var complete = false;
var canvas = document.getElementById('canvas')
var ctx;

function line_intersects(p0, p1, p2, p3) {
    var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1['x'] - p0['x'];
    s1_y = p1['y'] - p0['y'];
    s2_x = p3['x'] - p2['x'];
    s2_y = p3['y'] - p2['y'];

    var s, t;
    s = (-s1_y * (p0['x'] - p2['x']) + s1_x * (p0['y'] - p2['y'])) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (p0['y'] - p2['y']) - s2_y * (p0['x'] - p2['x'])) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
    {
        // Collision detected
        return true;
    }
    return false; // No collision
}

function point(x, y){
    ctx.fillStyle="white";
    ctx.strokeStyle = "white";
    ctx.fillRect(x-2,y-2,4,4);
    ctx.moveTo(x,y);
}

function undo(){
    ctx = undefined;
    perimeter.pop();
    complete = false;
    start(true);
}

function clear_canvas(){
    ctx = undefined;
    perimeter = []
    complete = false;
    document.getElementById('coordinates').value = '';
    start(true);
    start(false)
}

function draw(end){
    ctx.lineWidth = 1;
    ctx.strokeStyle = "white";
    ctx.lineCap = "square";
    ctx.beginPath();

    for(var i=0; i<perimeter.length; i++){
        if(i==0){
            ctx.moveTo(perimeter[i]['x'],perimeter[i]['y']);
            end || point(perimeter[i]['x'],perimeter[i]['y']);
        } else {
            ctx.lineTo(perimeter[i]['x'],perimeter[i]['y']);
            end || point(perimeter[i]['x'],perimeter[i]['y']);
        }
    }
    if(end){
        ctx.lineTo(perimeter[0]['x'],perimeter[0]['y']);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fill();
        ctx.strokeStyle = 'blue';
        complete = true;
    }
    ctx.stroke();

    // print coordinates
    if(perimeter.length == 0){
        document.getElementById('coordinates').value = '';
    } else {
        document.getElementById('coordinates').value = JSON.stringify(perimeter);
    }
}

function check_intersect(x,y){
    if(perimeter.length < 4){
        return false;
    }
    var p0 = []
    var p1 = []
    var p2 = []
    var p3 = []

    p2['x'] = perimeter[perimeter.length-1]['x'];
    p2['y'] = perimeter[perimeter.length-1]['y'];
    p3['x'] = x;
    p3['y'] = y;

    for(var i=0; i<perimeter.length-1; i++){
        p0['x'] = perimeter[i]['x'];
        p0['y'] = perimeter[i]['y'];
        p1['x'] = perimeter[i+1]['x'];
        p1['y'] = perimeter[i+1]['y'];
        if(p1['x'] == p2['x'] && p1['y'] == p2['y']){ continue; }
        if(p0['x'] == p3['x'] && p0['y'] == p3['y']){ continue; }
        if(line_intersects(p0,p1,p2,p3)==true){
            return true;
        }
    }
    return false;
}

function point_it(event) {
    if(complete){
        alert('Polygon already created');
        return false;
    }
    var rect, x, y;

    if(event.ctrlKey || event.which === 3 || event.button === 2){
        if(perimeter.length==2){
            alert('You need at least three points for a polygon');
            return false;
        }
        x = perimeter[0]['x'];
        y = perimeter[0]['y'];
        if(check_intersect(x,y)){
            alert('The line you are drowing intersect another line');
            return false;
        }
        draw(true);
        alert('Polygon closed');
        event.preventDefault();
        return false;
    } else {
        rect = canvas.getBoundingClientRect();
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
        if (perimeter.length>0 && x == perimeter[perimeter.length-1]['x'] && y == perimeter[perimeter.length-1]['y']){
            // same point - double click
            return false;
        }
        if(check_intersect(x,y)){
            alert('The line you are drowing intersect another line');
            return false;
        }
        perimeter.push({'x':x,'y':y});
        draw(false);
        return false;
    }
}

function start(with_draw) {
    var img = new Image();
    var imageSrc = $.cookie('cameraPicture')
    img.src = imageSrc


    ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if(with_draw == true){
        canvas.setAttribute('data-imgsrc', imageSrc)
        draw(false);
    }
}

function rerender() {
    var img = new Image();
    img.src = $.cookie('cameraPicture')
    ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

if (location.href.split("/").slice(-1) == "cameraPage.html"){
    start()
}
/*****************************************************************************************************************************/



var green = angular.module('green', ['ngCookies', 'ngFlash', 'ngMaterial']);


green.controller('userCtrl', ['$scope', '$cookies', 'Flash', function($scope, $cookies, Flash) {

    $scope.submit = function (user) {
        console.log('Adding new user');
        $.ajax({
            type: "POST",
            url: `${environment}/api/users/addNewUser`,
            data: user,
            cache: false,
            success: function () {
                console.log("Form Data Sent successfully");
                window.location.href = "index.html"
            }
        });
    };

    $scope.login = function (user) {
        console.log('Login');
        $.ajax({
            type: "POST",
            url: `${environment}/api/users/login`,
            data: user,
            cache: false,
            success: function (data) {
                console.log(data)
                console.log(data.redirect)
                $cookies.put("userId", data.userId)
                $cookies.put("cameras", JSON.stringify(data.cameras))
                var id = Flash.create('info', 'HELLO', 0, {class: 'custom-class', id: 'custom-id'}, true)
                console.log("Form Data Sent successfully");

                window.location.href = data.redirect
            },
            error: function (error) {
                console.log(error.responseText)
                var id = Flash.create('info', error.responseText, 0, {class: 'custom-class', id: 'custom-id'}, true)
            }
        })
    }
}])

green.controller('hamburger', function($scope, $cookies) {

    $scope.logout = function() {
        console.log('controller - logout')

        var cookies = $cookies.getAll()
        angular.forEach(cookies, function (v, k) {
            $cookies.remove(k)
        })

        $.ajax({
            type: "GET",
            url: `${environment}/api/users/logout`,
            cache: false,
            success: function(data) {
                console.log(data)
            }
        })
    }
})


green.controller('getCameras',['$scope','$cookies','$compile', function($scope,$cookies,$compile) {

    $scope.getUsersCameras = function () {
        window.location.href ="cameras.html"
    }
    $scope.getAllcameras = function(){
        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/getAll`,
            cache: false,
            success: function(cameras) {
                $scope.cameras = cameras

                $('.nav-second-level').remove('.user-camera')

                for (var camera of cameras) {
                    $('.nav-second-level').append(
                        '<li class="user-camera">'
                        +'<a ng-click="getCamera('+camera.id+')"><i class="fa fa-user- fa-fw"></i>'+camera.id+'</a>'+
                        '</il>' )
                }
            }
        })
    }

    $scope.attachNewCamera = function(){
        const userId = $cookies.get("userId")
        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/getFreeCameras`,
            cache: false,
            success: function(cameras) {
                console.log(cameras)
                for (var cam of cameras){
                    var gallery = document.createElement('div')
                    gallery.id = "galery"
                    gallery.style.float = "left"
                    gallery.style.padding = "3px 6px"
                    gallery.style.margin = "0px 3px 3px"
                    gallery.style.border = "1px solid #ccc"

                    gallery.innerHTML = "<p> <b>camera number:</b> "+cam.id+"</p>"+
                        "<img display='block' width='300' height='200' src='"+cam.picture+"'> " +
                        "<button display='block' type='button' id='"+cam.id+"' ng-click='toggleState("+cam.id+")'>Attach Camera </button> "
                    document.getElementById('center').appendChild(gallery)

                }
                $compile(gallery)($scope);
                $scope.$digest();
            }
        })
    }
   }])


green.controller('cameras', function($scope, $cookies, $compile, $mdDialog) {

    $scope.initUserCameras = function () {
        console.log('initUserCameras')
        var userId = $cookies.get("userId")
        $.ajax({
            type: "GET",
            url: `${environment}/api/users/getUsersCameras/${userId}`,
            cache: false,
            success: function(cameras) {
                $('.cameraTD').remove()
                console.log(cameras)
                for (var camera of cameras) {
                    console.log(camera.id)
                    if(camera.status == 1) {
                        $('table').append(
                            '<tr class="cameraTD">' +
                            '<td id="icon"><i id="trash" class="fa fa-trash-o" ng-click=""></i></td>'+
                            '<td id="icon"><i class="fa fa-video-camera fa-fw"></i></td>' +
                            '<td id="cameraId">' + camera.id + '</td>' +
                            '<td id="cameraName"></td>' +
                            '<td id="rename"><input></td>' +
                            '<td id="define area"><button class="btn" id=' + camera.id + ' ng-click="defineArea('+camera.id+')">set area</button></td>' +
                            '<td id="LifePicture"><button class="btn" ng-click="getLivePicture('+camera.id+')">Get Picture</button></td>'+
                            '<td><button id="statusOn" class="btn" ng-click="stopCamera('+camera.id+')">On</button></td>'+
                            '</tr>'
                        )
                    } else {
                        $('table').append(
                            '<tr class="cameraTD">' +
                            '<td id="icon"><i id="trash" class="fa fa-trash-o" ng-click=""></i></td>'+
                            '<td id="icon"><i class="fa fa-video-camera fa-fw"></i></td>' +
                            '<td id="cameraId">' + camera.id + '</td>' +
                            '<td id="cameraName"></td>' +
                            '<td id="rename"><input></td>' +
                            '<td id="define area"><button class="btn" id=' + camera.id + ' ng-click="defineArea('+camera.id+')">set area</button></td>' +
                            '<td id="LifePicture"><button class="btn" ng-click="getLivePicture('+camera.id+')">Get Picture</button></td>'+
                            '<td><button id="statusOff" class="btn" ng-click="startCamera('+camera.id+')">Off</button></td>'+
                            '</tr>'
                        )
                    }
                }
                var table = document.querySelector('#table')
                $compile(table)($scope)
            }
        })

    }

    $scope.addCamera = function () {
        console.log($scope.add)
        const userId = $cookies.get("userId")

        console.log(userId)
        $.ajax({
            type: "post",
            url: `${environment}/api/users/attachCameraToUser/${userId}`,
            cache: false,
            data:{"cameraId": $scope.add},
            success: function(data) {
                console.log(data.value.id)
                $('table').append(
                    '<tr>' +
                        '<td id="trash"><i class="fa fa-trash-o" ng-click=""></i></td>' +
                        '<td id="icon"><i class="fa fa-video-camera fa-fw"></i></td>' +
                        '<td id="cameraId">' + data.value.id + '</td>' +
                        '<td id="cameraName"></td>' +
                        '<td id="rename"><input></td>' +
                        '<td id="define area"><button class="btn" ng-click="defineArea('+data.value.id+')">set area</button></td>' +
                        '<td id="LifePicture"><button class="btn" id="start" ng-click="getLifePicture('+data.value.id+')">Get Picture</button></td>'+
                        '<td id="status"><button class="btn" ng-click="startCamera('+data.value.id+')">Active</button></td>' +
                    '</tr>'
                )
                var table = document.querySelector('#table')
                $compile(table)($scope)
            }
        });
    }

    $scope.defineArea = function (cameraId) {
        console.log('Get Camera')
        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/getCamera/${cameraId}`,
            cache: false,
            success: function(data) {
                console.log(data)
                $cookies.put("cameraId", data.id)
                $cookies.put("cameraPicture", data.picture)
                $cookies.put("cameraIp", data.ip)
                $cookies.put("cameraPort", data.port)

                var cameraName = $cookies.get("cameraName")
                window.location.href ="cameraPage.html"
            }
        });
    }

    $scope.getLivePicture = function (cameraId, ev) {
        console.log('getLivePicture function')
        $cookies.put('liveImageId', cameraId)
        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/getLiveImage/${cameraId}`,
            cache: false,
            success: function(image) {
                sessionStorage.setItem(`liveImage-${cameraId}`, image.message)
                $mdDialog.show({
                    templateUrl: 'liveImage.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose:true,
                })
                    .then(function(answer) {
                        $scope.status = 'You said the information was "' + answer + '".';
                    }, function() {
                        $scope.status = 'You cancelled the dialog.';
                    });
            },
            error: function(err){
                console.log(err)
            }
        })
    }


    $scope.startCamera = function(cameraId){

        console.log(`Start Camera - ${cameraId}`)

        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/startCamera/${cameraId}`,
            cache: false,
            success: function(data) {
                console.log(data)
                $scope.initUserCameras()
            },
            error: function(err) {
                console.log(err)
            }
        })
    }


    $scope.stopCamera = function(cameraId){

        console.log(`Stop Camera - ${cameraId}`)

        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/stopCamera/${cameraId}`,
            cache: false,
            success: function(data) {
                console.log(data)
                $scope.initUserCameras()
            },
            error: function(err) {
                console.log(err)
            }
        })
    }
});

green.controller('cameraPage', function($scope, $cookies) {

    $scope.initializePage = function() {
        console.log('Initialize')
        var userId = $cookies.get("userId")
        var cameraId = $cookies.get("cameraId")
        var cameraPicture = $cookies.get("cameraPicture")
        var cameraName = $cookies.get("cameraName")
        var cameraData = $cookies.get("cameraData")

        if(cameraName)
            $scope.cameraTitle = cameraName
        else
            $scope.cameraTitle = cameraId

        $('#myImage').attr("src", cameraPicture)

    }

    $scope.getCamera = function(cameraId){
        console.log('Get Camera')
        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/getCamera/${cameraId}`,
            cache: false,
            success: function(data) {
                console.log(data)
                $cookies.put("cameraId", data.id)
                $cookies.put("cameraPicture", data.picture)
                $cookies.put("cameraIp", data.ip)
                $cookies.put("cameraPort", data.port)


                if(data.name)
                    $cookies.put("cameraName", data.name)
                else
                    $cookies.remove("cameraName")
                window.location.href ="cameraPage.html"
            }
        })
    }

    $scope.setRule = function(){
        var cameraId = $cookies.get("cameraId")
        var cameraPicture = $cookies.get("cameraPicture")
        // console.log($scope.inOut)
        console.log(perimeter)

        $.post(`${environment}/api/cameras/setRule/${cameraId}`, {
                "inOut": $scope.inOut,
                "polygon": perimeter
            },
            function(data, status){
                if(status == 200){
                    window.location.href ="cameras.html"
                }
                if(status == 400)
                alert("Data: " + data.message + "\nStatus: " + status);
            })


        for(var i=0; i < perimeter.length; i++)
            console.log("Point " + i + " - X: " + perimeter[i].x + " Y: " + perimeter[i].y)
    }

})



green.controller('notifications', function($scope, $cookies, $compile, $mdDialog) {

    $scope.getUsersNotifications = function() {
        console.log('Getting users notifications')
        var userId = $cookies.get("userId")

        $.ajax({
            type: "GET",
            url: `${environment}/api/users/getUsersAlerts/${userId}`,
            cache: false,
            success: function(data) {
                for (var alert of data) {
                    var date = new Date(parseInt(alert.timestamp) * 1000).toUTCString().replace(/T|Z|.000/gi, " ")
                    $('table').append(
                        '<tr>' +
                        `<td id="cameraId">${alert.cameraId}</td>` +
                        `<td id="alertTime">${date}</td>` +
                        `<td><button class="btn" id="start" data-ng-click='createCarousel(${alert.alertId})'>Show Pictures</button></td>` +
                        '</tr>'
                    )
                }
                var table = document.querySelector('#table')
                $compile(table)($scope)
            }
        })
    }


    $scope.createCarousel = function(alertId, ev) {
        $cookies.put("alertId", alertId)
        $mdDialog.show({
            templateUrl: 'alertCarousel.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true,
        })
            .then(function(answer) {
                $scope.status = 'You said the information was "' + answer + '".';
            }, function() {
                $scope.status = 'You cancelled the dialog.';
            });
    }



    $scope.getCamera = function(cameraId){
        console.log('Get Camera')
        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/getCamera/${cameraId}`,
            cache: false,
            success: function(data) {
                console.log(data)
                $cookies.put("cameraId", data.id)
                $cookies.put("cameraPicture", data.picture)
                $cookies.put("cameraIp", data.ip)
                $cookies.put("cameraPort", data.port)

                if(data.name)
                    $cookies.put("cameraName", data.name)
                else
                    $cookies.remove("cameraName")

                window.location.href ="cameraPage.html"
            }
        })
    }
})


green.controller('carousel', function($scope, $cookies) {

    $scope.initializeCarousel = () => {
        var alertId = $cookies.get("alertId")
        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/getAlert/${alertId}`,
            cache: false,
            success: function(alert) {
                for (var pic in alert.doc.pictures) {
                    var item
                    if(pic == 0) {
                        item = '<div class="item active">' +
                                        `<img src=${alert.doc.pictures[pic]['photo']} alt="Los Angeles">` +
                                    '</div>'
                    } else {
                        item = '<div class="item">' +
                                        `<img src=${alert.doc.pictures[pic]['photo']} alt="Los Angeles">` +
                                    '</div>'
                    }
                    $('.carousel-inner').append(item)
                }
            }
        })
    }
})


green.controller('liveImage', function($scope, $cookies) {

    console.log('controller - liveImage')

    $scope.initializeCarousel = () => {
        var liveImageId = $cookies.get("liveImageId")
        var liveImage = sessionStorage.getItem(`liveImage-${liveImageId}`)
        var image = 'data:image/png;base64,'+liveImage

        setTimeout(function(){ $('.carousel-inner').append('<div class="item active">' + `<img src=${image}>` + '</div>'); }, 1000)
    }
})


function toggleState (cameraId) {

    var userId = decodeURIComponent(document.cookie).slice(8)
    var userId = userId.slice(0,-1)
    console.log(userId)
    console.log(cameraId)
    $.ajax({
        type: "post",
        url: `${environment}/api/users/attachCameraToUser/${userId}`,
        cache: false,
        data:{"cameraId": cameraId},
        success: function(data) {
            alert(data)
            console.log(data)
        }
    })
}


