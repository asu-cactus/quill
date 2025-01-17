const angular = require("angular");
const swal = require("sweetalert");
// const flatpickr = require("flatpickr");

angular.module('reg')
  .controller('ApplicationCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    '$http',
    'currentUser',
    'settings',
    'Session',
    'UserService',
    function($scope, $rootScope, $state, $http, currentUser, settings, Session, UserService) {

      // Set up the user
      $scope.user = currentUser.data;
      $scope.userAdmitted = $scope.user.status && $scope.user.status.admitted && $scope.user.status.completedProfile;
      // $scope.userBirth = new Date(Date.parse($scope.user.profile.dob));
      // flatpickr("#userDob", {
      //   disableMobile: "true",
      //   defaultDate: new Date(Date.parse($scope.user.profile.dob)),
      //   onChange: function(selectedDates, dateStr, instance) {
      //     $scope.user.profile.dob = selectedDates[0].toLocaleDateString("en-US");
      //   }
      // });

      // Is the student from MIT?
      // $scope.isMitStudent = $scope.user.email.split('@')[1] == 'mit.edu';

      // If so, default them to adult: true
      // if ($scope.isMitStudent){
      //   $scope.user.profile.adult = true;
      // }

      // Populate the school dropdown
      populateSchools();
      _setupForm();

      $scope.regIsClosed = Date.now() > settings.data.timeClose;

      $scope.hackStart = new Date(settings.data.hackStart).toLocaleDateString("en-US");

      /**
       * TODO: JANK WARNING
       */
      function populateSchools(){
        $http
          .get('/assets/schools.json')
          .then(function(res){
            var schools = res.data;
            var email = $scope.user.email.split('@')[1];

            if (schools[email]){
              $scope.user.profile.school = schools[email].school;
              $scope.autoFilledSchool = true;
            }
          });

        $http
          .get('/assets/schools.csv')
          .then(function(res){
            $scope.schools = res.data.split('\n');
            $scope.schools.push('Other');

            var content = [];

            for(i = 0; i < $scope.schools.length; i++) {
              $scope.schools[i] = $scope.schools[i].trim();
              content.push({title: $scope.schools[i]});
            }

            $('#school.ui.search')
              .search({
                source: content,
                cache: true,
                onSelect: function(result, response) {
                  $scope.user.profile.school = result.title.trim();
                }
              });
          });

          $http
            .get('/assets/countries.csv')
            .then(function(res){
              $scope.countries = res.data.split('\n');
              $scope.countries.push('Other');
  
              var content = [];
  
              for(i = 0; i < $scope.countries.length; i++) {
                $scope.countries[i] = $scope.countries[i].trim();
                content.push({title: $scope.countries[i]});
              }

              $('#country.ui.search')
                .search({
                  source: content,
                  cache: true,
                  onSelect: function(result, response) {
                    $scope.user.profile.country = result.title.trim();
                  }
                });
            });
      }

      function _updateUser(e){
        // $scope.user.profile.dob = new Date($scope.userBirth).toLocaleDateString("en-US");

        UserService
          .updateProfile(Session.getUserId(), $scope.user.profile)
          .then(response => {
            swal("Awesome!", "Your application has been saved.", "success").then(value => {
              $state.go("app.dashboard");
            });
          }, response => {
            swal("Uh oh!", "Error: " + response.data.message, "error");
          });
      }

      function isMinor() {
        return !$scope.user.profile.adult;
      }

      function minorsAreAllowed() {
        return settings.data.allowMinors;
      }

      function minorsValidation() {
        // Are minors allowed to register?
        if (isMinor() && !minorsAreAllowed()) {
          return false;
        }
        return true;
      }

      function _setupForm(){
        // Custom minors validation rule
        $.fn.form.settings.rules.allowMinors = function (value) {
          return minorsValidation();
        };

        // Semantic-UI form validation
        $('.ui.form').form({
          inline: true,
          fields: {
            name: {
              identifier: 'name',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your name.'
                }
              ]
            },
            school: {
              identifier: 'school',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your school name.'
                }
              ]
            },
            // dateOfBirth: {
            //   identifier: 'dateOfBirth',
            //   rules: [
            //     {
            //       type: 'empty',
            //       prompt: 'Please select your Date of Birth.'
            //     }
            //   ]
            // },
            country: {
              identifier: 'country',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select your country.'
                }
              ]
            },
            department: {
              identifier: 'department',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select your major/department.'
                }
              ]
            },
            // year: {
            //   identifier: 'year',
            //   rules: [
            //     {
            //       type: 'empty',
            //       prompt: 'Please select your graduation year.'
            //     }
            //   ]
            // },
            gender: {
              identifier: 'gender',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select a gender.'
                }
              ]
            },
            adult: {
              identifier: 'adult',
              rules: [
                {
                  type: 'allowMinors',
                  prompt: 'You must be an adult.'
                }
              ]
            }
          }
        });
      }

      $scope.submitForm = function(){
        $('.ui.form').form('validate form');
        if ($('.ui.form').form('is valid')){
          _updateUser();
        } else {
          swal("Uh oh!", "Please Fill The Required Fields", "error");
        }
      };
    }]);
