variable "aws_region" {
    default = "ap-south-1"
    type = string
}

variable "cluster_instance_type" {

  type        = string
  default     = "m7i-flex.large"
}

variable "key_name" {
  
  default = "project-key.pem"
  type    = string
}

variable "ssh_cidr" {
  type        = string
  default     = "0.0.0.0/0"
}

variable "cluster_volume_size" {
  description = "Root EBS volume size in GB (Free Tier allows up to 30GB)"
  type        = number
  default     = 30
}

variable "jenkins_instance_type" {
    default = "c7i-flex.large"
    type = string 
}

variable "jenkins_volume_size" {
  description = "Root EBS volume size in GB (Free Tier allows up to 30GB)"
  type        = number
  default     = 20
}